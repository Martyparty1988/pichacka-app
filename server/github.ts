import fetch from 'node-fetch';
import { Request, Response } from 'express';

interface GitHubResponse {
  content?: {
    html_url: string;
  };
  message?: string;
}
import { storage } from './storage';

// Funkce pro export dat na GitHub
export async function exportToGitHub(req: Request, res: Response) {
  try {
    const { token, repo, owner, message } = req.body;
    
    if (!token || !repo || !owner) {
      return res.status(400).json({ error: 'Chybí potřebné parametry (token, repo, owner)' });
    }
    
    // Získat data pro export
    const workLogs = await storage.getAllWorkLogs();
    const finances = await storage.getAllFinances();
    const debts = await storage.getAllDebts();
    
    // Vytvořit JSON obsah
    const exportData = {
      exportDate: new Date().toISOString(),
      workLogs,
      finances,
      debts
    };
    
    // Převést na řetězec pro uložení
    const content = Buffer.from(JSON.stringify(exportData, null, 2)).toString('base64');
    
    // Název souboru s timestampem
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `export_${timestamp}.json`;
    
    // API volání pro vytvoření nebo aktualizaci souboru na GitHubu
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${filename}`, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        message: message || `Export dat z aplikace Píchačka - ${new Date().toLocaleDateString('cs-CZ')}`,
        content,
        branch: 'main' // Nebo master, záleží na výchozí větvi repozitáře
      })
    });
    
    const result = await response.json() as GitHubResponse;
    
    if (response.ok) {
      return res.status(200).json({ 
        success: true, 
        message: 'Data byla úspěšně exportována na GitHub',
        url: result.content?.html_url || null
      });
    } else {
      return res.status(response.status).json({ 
        error: 'Nepodařilo se exportovat data na GitHub', 
        details: result 
      });
    }
  } catch (error) {
    console.error('Chyba při exportu na GitHub:', error);
    return res.status(500).json({ error: 'Interní chyba serveru při exportu dat' });
  }
}