import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GitBranch, Download, Check, AlertCircle } from 'lucide-react';

interface GitHubExportProps {
  className?: string;
}

export function GitHubExport({ className }: GitHubExportProps) {
  const [owner, setOwner] = useState('');
  const [repo, setRepo] = useState('');
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [exportUrl, setExportUrl] = useState<string | null>(null);
  const { toast } = useToast();
  
  const handleExport = async () => {
    if (!owner || !repo || !token) {
      toast({
        title: "Chybí údaje",
        description: "Prosím vyplňte všechny potřebné informace pro export.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await apiRequest<{success?: boolean; url?: string; error?: string}>('POST', '/api/github/export', {
        owner,
        repo,
        token,
        message: `Export z aplikace Píchačka - ${new Date().toLocaleDateString('cs-CZ')}`
      });
      
      if (response && response.success) {
        toast({
          title: "Export úspěšný",
          description: "Data byla úspěšně exportována na GitHub.",
          variant: "default"
        });
        if (response.url) {
          setExportUrl(response.url);
        }
      } else {
        toast({
          title: "Export selhal",
          description: (response && response.error) || "Nastala chyba při exportu dat.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export selhal",
        description: "Nastala chyba při komunikaci se serverem.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          Export na GitHub
        </CardTitle>
        <CardDescription>
          Exportujte data z aplikace do GitHub repozitáře
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="owner">Vlastník repozitáře</Label>
            <Input
              id="owner"
              placeholder="např. janovdoe"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="repo">Název repozitáře</Label>
            <Input
              id="repo"
              placeholder="např. pichacka-data"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="token">GitHub Personal Access Token</Label>
            <Input
              id="token"
              type="password"
              placeholder="ghp_..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Potřebujete token s oprávněním pro zápis do repozitáře. 
              <a 
                href="https://github.com/settings/tokens/new" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 ml-1"
              >
                Vytvořit token
              </a>
            </p>
          </div>
          
          {exportUrl && (
            <div className="mt-4 p-3 bg-green-50 border border-green-100 rounded-md">
              <div className="flex items-start">
                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-800">Export úspěšný!</p>
                  <a 
                    href={exportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    Zobrazit exportovaný soubor
                  </a>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-amber-50 p-3 rounded-md border border-amber-100">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5 mr-2" />
              <div>
                <p className="text-sm font-medium text-amber-800">Bezpečnostní upozornění</p>
                <p className="text-xs text-amber-700">
                  GitHub token je citlivý údaj. Neukládáme jej, ale používáme pouze pro tento export.
                  Pro maximální bezpečnost token po použití smažte.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleExport} 
          disabled={isLoading || !owner || !repo || !token}
          className="w-full"
        >
          {isLoading ? (
            <>Exportuji data...</>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" /> 
              Exportovat data
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}