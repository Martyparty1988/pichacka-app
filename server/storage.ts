import { 
  users, type User, type InsertUser,
  activities, type Activity, type InsertActivity,
  persons, type Person, type InsertPerson,
  workLogs, type WorkLog, type InsertWorkLog,
  finances, type Finance, type InsertFinance,
  debts, type Debt, type InsertDebt,
  debtPayments, type DebtPayment, type InsertDebtPayment,
  timerSessions, type TimerSession, type InsertTimerSession,
  settings, type Settings, type InsertSettings
} from "@shared/schema";
import { CONSTANTS } from "../client/src/lib/constants";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Work Log operations
  getAllWorkLogs(): Promise<WorkLog[]>;
  getRecentWorkLogs(limit: number): Promise<WorkLog[]>;
  getWorkLogsByPersonId(personId: number): Promise<WorkLog[]>;
  getWorkLogsByActivityId(activityId: number): Promise<WorkLog[]>;
  getWorkLogsByDateRange(startDate: Date, endDate: Date): Promise<WorkLog[]>;
  createWorkLog(workLog: InsertWorkLog): Promise<WorkLog>;
  getWorkLogsSummaryForDay(date: Date): Promise<{ date: Date, workTimeMinutes: number, earnings: number, deduction: number }>;
  getWorkLogsSummaryForDateRange(startDate: Date, endDate: Date): Promise<{ workTimeMinutes: number, earnings: number, deduction: number }>;
  
  // Finance operations
  getAllFinances(): Promise<Finance[]>;
  getFinancesByType(type: string): Promise<Finance[]>;
  getFinancesByCurrency(currency: string): Promise<Finance[]>;
  createFinance(finance: InsertFinance): Promise<Finance>;
  
  // Debt operations
  getAllDebts(): Promise<Debt[]>;
  getDebtById(id: number): Promise<Debt | undefined>;
  createDebt(debt: InsertDebt): Promise<Debt>;
  updateDebt(id: number, data: Partial<Debt>): Promise<Debt>;
  
  // Debt Payment operations
  getAllDebtPayments(): Promise<DebtPayment[]>;
  getDebtPaymentsByDebtId(debtId: number): Promise<DebtPayment[]>;
  createDebtPayment(payment: InsertDebtPayment): Promise<DebtPayment>;
  
  // Timer Session operations
  getCurrentTimerSession(): Promise<TimerSession | undefined>;
  createTimerSession(session: InsertTimerSession): Promise<TimerSession>;
  updateTimerSession(id: number, data: Partial<TimerSession>): Promise<TimerSession>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private activities: Map<number, Activity>;
  private persons: Map<number, Person>;
  private workLogs: Map<number, WorkLog>;
  private finances: Map<number, Finance>;
  private debts: Map<number, Debt>;
  private debtPayments: Map<number, DebtPayment>;
  private timerSessions: Map<number, TimerSession>;
  private settings: Map<number, Settings>;
  
  private userId: number;
  private activityId: number;
  private personId: number;
  private workLogId: number;
  private financeId: number;
  private debtId: number;
  private debtPaymentId: number;
  private timerSessionId: number;
  private settingsId: number;
  
  constructor() {
    this.users = new Map();
    this.activities = new Map();
    this.persons = new Map();
    this.workLogs = new Map();
    this.finances = new Map();
    this.debts = new Map();
    this.debtPayments = new Map();
    this.timerSessions = new Map();
    this.settings = new Map();
    
    this.userId = 1;
    this.activityId = 1;
    this.personId = 1;
    this.workLogId = 1;
    this.financeId = 1;
    this.debtId = 1;
    this.debtPaymentId = 1;
    this.timerSessionId = 1;
    this.settingsId = 1;
    
    // Initialize with some demo data
    this.initDemoData();
  }
  
  private initDemoData() {
    // Create demo user
    this.createUser({
      username: "demo@example.com",
      password: "password",
      displayName: "Marie Nováková",
      avatarInitials: "MN"
    });
    
    // Create persons
    CONSTANTS.PERSONS.forEach(person => {
      this.persons.set(person.id, {
        id: person.id,
        name: person.name,
        hourlyRate: person.hourlyRate,
        deductionRate: person.deductionRate
      });
    });
    
    // Create activities
    CONSTANTS.ACTIVITIES.forEach(activity => {
      this.activities.set(activity.id, {
        id: activity.id,
        name: activity.name,
        color: activity.color
      });
    });
    
    // Create demo work logs
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    
    // Today logs
    this.createWorkLog({
      personId: 1,
      activityId: 1,
      startTime: new Date(today.setHours(9, 0, 0, 0)),
      endTime: new Date(today.setHours(11, 15, 0, 0)),
      durationMinutes: 2.25 * 60,
      earnings: 619,
      deduction: 206
    });
    
    this.createWorkLog({
      personId: 1,
      activityId: 2,
      startTime: new Date(today.setHours(13, 0, 0, 0)),
      endTime: new Date(today.setHours(14, 45, 0, 0)),
      durationMinutes: 1.75 * 60,
      earnings: 481,
      deduction: 160
    });
    
    // Yesterday logs
    this.createWorkLog({
      personId: 1,
      activityId: 3,
      startTime: new Date(yesterday.setHours(10, 0, 0, 0)),
      endTime: new Date(yesterday.setHours(11, 0, 0, 0)),
      durationMinutes: 1 * 60,
      earnings: 275,
      deduction: 92
    });
    
    this.createWorkLog({
      personId: 1,
      activityId: 1,
      startTime: new Date(yesterday.setHours(14, 0, 0, 0)),
      endTime: new Date(yesterday.setHours(17, 30, 0, 0)),
      durationMinutes: 3.5 * 60,
      earnings: 963,
      deduction: 321
    });
    
    // Create demo finances
    this.createFinance({
      amount: 5000,
      currency: "CZK",
      description: "Faktura za projekt",
      type: "income",
      category: "Práce",
      date: new Date(today.setDate(today.getDate() - 2)),
      offsetByEarnings: 1200
    });
    
    this.createFinance({
      amount: 1500,
      currency: "CZK",
      description: "Nákup potravin",
      type: "expense",
      category: "Jídlo",
      date: new Date(today.setDate(today.getDate() - 1)),
      offsetByEarnings: 0
    });
    
    this.createFinance({
      amount: 200,
      currency: "EUR",
      description: "Platba za služby",
      type: "income",
      category: "Práce",
      date: new Date(today.setDate(today.getDate() - 3)),
      offsetByEarnings: 0
    });
    
    // Create demo debts
    this.createDebt({
      name: "Půjčka na auto",
      totalAmount: 78500,
      remainingAmount: 36200,
      paidAmount: 42300,
      active: true
    });
    
    this.createDebt({
      name: "Kreditní karta",
      totalAmount: 22400,
      remainingAmount: 7840,
      paidAmount: 14560,
      active: true
    });
    
    this.createDebt({
      name: "Půjčka od rodičů",
      totalAmount: 30000,
      remainingAmount: 24000,
      paidAmount: 6000,
      active: true
    });
    
    // Create demo debt payments
    this.createDebtPayment({
      debtId: 1,
      amount: 5000,
      date: new Date(today.setDate(today.getDate() - 30))
    });
    
    this.createDebtPayment({
      debtId: 1,
      amount: 5000,
      date: new Date(today.setDate(today.getDate() - 60))
    });
    
    this.createDebtPayment({
      debtId: 2,
      amount: 2000,
      date: new Date(today.setDate(today.getDate() - 15))
    });
  }
  
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Work Log operations
  async getAllWorkLogs(): Promise<WorkLog[]> {
    return Array.from(this.workLogs.values()).sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }
  
  async getRecentWorkLogs(limit: number): Promise<WorkLog[]> {
    return this.getAllWorkLogs().then(logs => logs.slice(0, limit));
  }
  
  async getWorkLogsByPersonId(personId: number): Promise<WorkLog[]> {
    return Array.from(this.workLogs.values())
      .filter(log => log.personId === personId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }
  
  async getWorkLogsByActivityId(activityId: number): Promise<WorkLog[]> {
    return Array.from(this.workLogs.values())
      .filter(log => log.activityId === activityId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }
  
  async getWorkLogsByDateRange(startDate: Date, endDate: Date): Promise<WorkLog[]> {
    return Array.from(this.workLogs.values())
      .filter(log => {
        const logDate = new Date(log.startTime);
        return logDate >= startDate && logDate <= endDate;
      })
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }
  
  async createWorkLog(insertWorkLog: InsertWorkLog): Promise<WorkLog> {
    const id = this.workLogId++;
    const workLog: WorkLog = { 
      ...insertWorkLog, 
      id,
      createdAt: new Date()
    };
    this.workLogs.set(id, workLog);
    return workLog;
  }
  
  async getWorkLogsSummaryForDay(date: Date): Promise<{ date: Date, workTimeMinutes: number, earnings: number, deduction: number }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const logs = await this.getWorkLogsByDateRange(startOfDay, endOfDay);
    
    const workTimeMinutes = logs.reduce((sum, log) => sum + log.durationMinutes, 0);
    const earnings = logs.reduce((sum, log) => sum + log.earnings, 0);
    const deduction = logs.reduce((sum, log) => sum + log.deduction, 0);
    
    return {
      date,
      workTimeMinutes,
      earnings,
      deduction
    };
  }
  
  async getWorkLogsSummaryForDateRange(startDate: Date, endDate: Date): Promise<{ workTimeMinutes: number, earnings: number, deduction: number }> {
    const logs = await this.getWorkLogsByDateRange(startDate, endDate);
    
    const workTimeMinutes = logs.reduce((sum, log) => sum + log.durationMinutes, 0);
    const earnings = logs.reduce((sum, log) => sum + log.earnings, 0);
    const deduction = logs.reduce((sum, log) => sum + log.deduction, 0);
    
    return {
      workTimeMinutes,
      earnings,
      deduction
    };
  }
  
  // Finance operations
  async getAllFinances(): Promise<Finance[]> {
    return Array.from(this.finances.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
  
  async getFinancesByType(type: string): Promise<Finance[]> {
    return Array.from(this.finances.values())
      .filter(finance => finance.type === type)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async getFinancesByCurrency(currency: string): Promise<Finance[]> {
    return Array.from(this.finances.values())
      .filter(finance => finance.currency === currency)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async createFinance(insertFinance: InsertFinance): Promise<Finance> {
    const id = this.financeId++;
    const finance: Finance = { ...insertFinance, id };
    this.finances.set(id, finance);
    return finance;
  }
  
  // Debt operations
  async getAllDebts(): Promise<Debt[]> {
    return Array.from(this.debts.values());
  }
  
  async getDebtById(id: number): Promise<Debt | undefined> {
    return this.debts.get(id);
  }
  
  async createDebt(insertDebt: InsertDebt): Promise<Debt> {
    const id = this.debtId++;
    const debt: Debt = { 
      ...insertDebt, 
      id,
      active: true,
      createdAt: new Date()
    };
    this.debts.set(id, debt);
    return debt;
  }
  
  async updateDebt(id: number, data: Partial<Debt>): Promise<Debt> {
    const debt = this.debts.get(id);
    if (!debt) {
      throw new Error(`Debt with id ${id} not found`);
    }
    
    const updatedDebt = { ...debt, ...data };
    this.debts.set(id, updatedDebt);
    return updatedDebt;
  }
  
  // Debt Payment operations
  async getAllDebtPayments(): Promise<DebtPayment[]> {
    return Array.from(this.debtPayments.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }
  
  async getDebtPaymentsByDebtId(debtId: number): Promise<DebtPayment[]> {
    return Array.from(this.debtPayments.values())
      .filter(payment => payment.debtId === debtId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async createDebtPayment(insertPayment: InsertDebtPayment): Promise<DebtPayment> {
    const id = this.debtPaymentId++;
    const payment: DebtPayment = { ...insertPayment, id };
    this.debtPayments.set(id, payment);
    
    // Update the debt's paid and remaining amounts
    const debt = this.debts.get(payment.debtId);
    if (debt) {
      const newPaidAmount = debt.paidAmount + payment.amount;
      const newRemainingAmount = debt.totalAmount - newPaidAmount;
      
      this.updateDebt(debt.id, {
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        active: newRemainingAmount > 0
      });
    }
    
    return payment;
  }
  
  // Timer Session operations
  async getCurrentTimerSession(): Promise<TimerSession | undefined> {
    return Array.from(this.timerSessions.values())
      .find(session => session.status !== 'stopped');
  }
  
  async createTimerSession(insertSession: InsertTimerSession): Promise<TimerSession> {
    const id = this.timerSessionId++;
    const session: TimerSession = { ...insertSession, id };
    this.timerSessions.set(id, session);
    return session;
  }
  
  async updateTimerSession(id: number, data: Partial<TimerSession>): Promise<TimerSession> {
    const session = this.timerSessions.get(id);
    if (!session) {
      throw new Error(`Timer session with id ${id} not found`);
    }
    
    const updatedSession = { ...session, ...data };
    this.timerSessions.set(id, updatedSession);
    return updatedSession;
  }
}

export const storage = new MemStorage();
