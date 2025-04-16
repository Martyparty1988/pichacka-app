import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertWorkLogSchema, insertFinanceSchema, insertDebtSchema, insertDebtPaymentSchema, insertTimerSessionSchema, insertUserSchema } from "@shared/schema";
import { CONSTANTS } from "../client/src/lib/constants";
import { setupAuth } from "./auth";
import { exportToGitHub } from "./github";

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);
  
  // Work Logs routes
  app.get('/api/work-logs', async (req, res) => {
    try {
      const workLogs = await storage.getAllWorkLogs();
      return res.status(200).json(workLogs);
    } catch (error) {
      console.error("Get work logs error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get('/api/work-logs/recent', async (req, res) => {
    try {
      const workLogs = await storage.getRecentWorkLogs(5);
      return res.status(200).json(workLogs);
    } catch (error) {
      console.error("Get recent work logs error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get('/api/work-logs/summary', async (req, res) => {
    try {
      const today = await storage.getWorkLogsSummaryForDay(new Date());
      const currentDate = new Date();
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const week = await storage.getWorkLogsSummaryForDateRange(startOfWeek, endOfWeek);
      
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const month = await storage.getWorkLogsSummaryForDateRange(startOfMonth, endOfMonth);
      
      return res.status(200).json({
        today: {
          date: today.date.toLocaleDateString('cs-CZ'),
          workTimeMinutes: today.workTimeMinutes,
          earnings: today.earnings,
          deduction: today.deduction
        },
        week: {
          range: `${startOfWeek.toLocaleDateString('cs-CZ')}-${endOfWeek.toLocaleDateString('cs-CZ')}`,
          workTimeMinutes: week.workTimeMinutes,
          earnings: week.earnings,
          deduction: week.deduction
        },
        month: {
          name: startOfMonth.toLocaleDateString('cs-CZ', { month: 'long' }),
          workTimeMinutes: month.workTimeMinutes,
          earnings: month.earnings,
          deduction: month.deduction
        }
      });
    } catch (error) {
      console.error("Get work logs summary error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get('/api/work-logs/charts', async (req, res) => {
    try {
      // Get data for charts
      const workLogs = await storage.getAllWorkLogs();
      
      // Group by day
      const dayMap = new Map();
      for (const log of workLogs) {
        const date = new Date(log.startTime);
        const dateStr = date.toLocaleDateString('cs-CZ');
        
        if (!dayMap.has(dateStr)) {
          dayMap.set(dateStr, { name: dateStr, minutes: 0, earnings: 0 });
        }
        
        const entry = dayMap.get(dateStr);
        entry.minutes += log.durationMinutes;
        entry.earnings += log.earnings;
      }
      
      // Group by activity
      const activityMap = new Map();
      for (const log of workLogs) {
        const activity = CONSTANTS.ACTIVITIES.find(a => a.id === log.activityId);
        if (!activity) continue;
        
        if (!activityMap.has(activity.id)) {
          activityMap.set(activity.id, { 
            name: activity.name, 
            minutes: 0, 
            earnings: 0,
            color: activity.color
          });
        }
        
        const entry = activityMap.get(activity.id);
        entry.minutes += log.durationMinutes;
        entry.earnings += log.earnings;
      }
      
      // Group by person
      const personMap = new Map();
      for (const log of workLogs) {
        const person = CONSTANTS.PERSONS.find(p => p.id === log.personId);
        if (!person) continue;
        
        if (!personMap.has(person.id)) {
          personMap.set(person.id, { 
            name: person.name, 
            minutes: 0, 
            earnings: 0
          });
        }
        
        const entry = personMap.get(person.id);
        entry.minutes += log.durationMinutes;
        entry.earnings += log.earnings;
      }
      
      return res.status(200).json({
        byDay: Array.from(dayMap.values()),
        byActivity: Array.from(activityMap.values()),
        byPerson: Array.from(personMap.values())
      });
    } catch (error) {
      console.error("Get work logs charts error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post('/api/work-logs', async (req, res) => {
    try {
      const data = insertWorkLogSchema.parse(req.body);
      const workLog = await storage.createWorkLog(data);
      return res.status(201).json(workLog);
    } catch (error) {
      console.error("Create work log error:", error);
      return res.status(400).json({ message: "Invalid data" });
    }
  });
  
  // Finances routes
  app.get('/api/finances', async (req, res) => {
    try {
      const finances = await storage.getAllFinances();
      return res.status(200).json(finances);
    } catch (error) {
      console.error("Get finances error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get('/api/finances/charts', async (req, res) => {
    try {
      const finances = await storage.getAllFinances();
      
      // Group by month
      const monthMap = new Map();
      for (const finance of finances) {
        const date = new Date(finance.date);
        const monthStr = date.toLocaleDateString('cs-CZ', { month: 'short', year: 'numeric' });
        
        if (!monthMap.has(monthStr)) {
          monthMap.set(monthStr, { name: monthStr, income: 0, expenses: 0, deduction: 0 });
        }
        
        const entry = monthMap.get(monthStr);
        if (finance.type === 'income') {
          entry.income += finance.amount;
          entry.deduction += finance.offsetByEarnings;
        } else {
          entry.expenses += finance.amount;
        }
      }
      
      // Group by currency over time
      const currencyMap = new Map();
      for (const finance of finances) {
        const date = new Date(finance.date);
        const dateStr = date.toLocaleDateString('cs-CZ');
        
        if (!currencyMap.has(dateStr)) {
          currencyMap.set(dateStr, { name: dateStr, CZK: 0, EUR: 0, USD: 0 });
        }
        
        const entry = currencyMap.get(dateStr);
        const amount = finance.type === 'income' ? finance.amount : -finance.amount;
        
        if (finance.currency === 'CZK') {
          entry.CZK += amount;
        } else if (finance.currency === 'EUR') {
          entry.EUR += amount;
        } else if (finance.currency === 'USD') {
          entry.USD += amount;
        }
      }
      
      return res.status(200).json({
        monthly: Array.from(monthMap.values()),
        currencies: Array.from(currencyMap.values())
      });
    } catch (error) {
      console.error("Get finances charts error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post('/api/finances', async (req, res) => {
    try {
      const data = insertFinanceSchema.parse(req.body);
      const finance = await storage.createFinance(data);
      return res.status(201).json(finance);
    } catch (error) {
      console.error("Create finance error:", error);
      return res.status(400).json({ message: "Invalid data" });
    }
  });
  
  // Debts routes
  app.get('/api/debts', async (req, res) => {
    try {
      const debts = await storage.getAllDebts();
      return res.status(200).json(debts);
    } catch (error) {
      console.error("Get debts error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get('/api/debts/stats', async (req, res) => {
    try {
      const debts = await storage.getAllDebts();
      
      let totalDebt = 0;
      let totalPaid = 0;
      
      debts.forEach(debt => {
        totalDebt += Number(debt.totalAmount);
        totalPaid += Number(debt.paidAmount);
      });
      
      // Assign colors to each debt
      const colors = ['#B39DDB', '#FFCC80', '#FFF59D', '#E6D7C3', '#F5F5F5'];
      const debtsWithColors = debts.map((debt, index) => ({
        name: debt.name,
        amount: Number(debt.remainingAmount),
        color: colors[index % colors.length]
      }));
      
      return res.status(200).json({
        totalDebt,
        totalPaid,
        debts: debtsWithColors
      });
    } catch (error) {
      console.error("Get debts stats error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post('/api/debts', async (req, res) => {
    try {
      const data = insertDebtSchema.parse(req.body);
      const debt = await storage.createDebt(data);
      return res.status(201).json(debt);
    } catch (error) {
      console.error("Create debt error:", error);
      return res.status(400).json({ message: "Invalid data" });
    }
  });
  
  // Debt Payments routes
  app.get('/api/debt-payments', async (req, res) => {
    try {
      const payments = await storage.getAllDebtPayments();
      
      // Enhance with debt names
      const debts = await storage.getAllDebts();
      const debtsMap = new Map(debts.map(debt => [debt.id, debt]));
      
      const enhancedPayments = payments.map(payment => ({
        ...payment,
        debtName: debtsMap.get(payment.debtId)?.name || 'Unknown Debt'
      }));
      
      return res.status(200).json(enhancedPayments);
    } catch (error) {
      console.error("Get debt payments error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post('/api/debt-payments', async (req, res) => {
    try {
      const data = insertDebtPaymentSchema.parse(req.body);
      const payment = await storage.createDebtPayment(data);
      return res.status(201).json(payment);
    } catch (error) {
      console.error("Create debt payment error:", error);
      return res.status(400).json({ message: "Invalid data" });
    }
  });
  
  // Timer Sessions routes
  app.get('/api/timer-sessions/current', async (req, res) => {
    try {
      const session = await storage.getCurrentTimerSession();
      return res.status(200).json(session);
    } catch (error) {
      console.error("Get current timer session error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  app.post('/api/timer-sessions', async (req, res) => {
    try {
      const data = insertTimerSessionSchema.parse(req.body);
      const session = await storage.createTimerSession(data);
      return res.status(201).json(session);
    } catch (error) {
      console.error("Create timer session error:", error);
      return res.status(400).json({ message: "Invalid data" });
    }
  });
  
  app.patch('/api/timer-sessions/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      const session = await storage.updateTimerSession(id, data);
      return res.status(200).json(session);
    } catch (error) {
      console.error("Update timer session error:", error);
      return res.status(400).json({ message: "Invalid data" });
    }
  });
  
  // GitHub export route
  app.post('/api/github/export', exportToGitHub);

  const httpServer = createServer(app);

  return httpServer;
}
