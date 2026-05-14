import { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Copy, Settings, CheckCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

type FocusTarget = 
  | { type: 'projectDeadline' }
  | { type: 'itemDeadline' }
  | { type: 'fileLocation' }
  | { type: 'step', id: string, field: 'item' | 'memo' | 'format' }
  | null;

interface NextStep {
  id: string;
  item: string;
  memo: string;
  format: string;
}

interface Project {
  name: string;
  deadline: string;
}

interface Phrase {
  category: string;
  phrase: string;
}

const MOCK_PROJECTS: Project[] = [
  { name: 'Skysport_Vizday_26', deadline: '5/19 all on air' },
  { name: 'Drone AR_26', deadline: '6/1 beta release' },
  { name: 'Virtual Studio Promo', deadline: '7/15 delivery' }
];

const MOCK_PHRASES: Phrase[] = [
  { category: '製作要求', phrase: 'build in Viz' },
  { category: '製作要求', phrase: 'export with Alpha' },
  { category: '時間通知', phrase: 'Before the end of today' },
  { category: '時間通知', phrase: 'Before the end of this week' },
  { category: '時間通知', phrase: 'Before the end of this month' },
  { category: '時間通知', phrase: 'ASAP' },
  { category: '格式說明', phrase: '1920x1080 60p MP4' },
  { category: '格式說明', phrase: 'PNG Sequence' },
  { category: '其它', phrase: "use client's updated logo" }
];

const DEFAULT_SIGNATURE = `please list below production steps
Project :\t
Item:\t
Steps:\t
Check Time:`;

export default function App() {
  const [gasUrl, setGasUrl] = useState<string>('');
  const [connectionMode, setConnectionMode] = useState<'checking' | 'online' | 'offline'>('checking');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [phrases, setPhrases] = useState<Phrase[]>(MOCK_PHRASES);

  const [includeSignature, setIncludeSignature] = useState(false);
  const [signatureText, setSignatureText] = useState(DEFAULT_SIGNATURE);

  const [selectedProject, setSelectedProject] = useState<string>('');
  const [projectDeadline, setProjectDeadline] = useState('');
  const [itemDeadline, setItemDeadline] = useState('');
  const [fileLocation, setFileLocation] = useState('');
  
  const [nextSteps, setNextSteps] = useState<NextStep[]>([
    { id: crypto.randomUUID(), item: '', memo: '', format: '' }
  ]);
  
  const [focusTarget, setFocusTarget] = useState<FocusTarget>(null);
  const [copied, setCopied] = useState(false);

  const fetchData = async (urlToFetch: string) => {
    if (!urlToFetch) {
      setConnectionMode('offline');
      setProjects(MOCK_PROJECTS);
      setPhrases(MOCK_PHRASES);
      return;
    }

    try {
      setIsLoading(true);
      setConnectionMode('checking');
      const res = await fetch(`${urlToFetch}?action=getInitData`);
      if (!res.ok) throw new Error('Network response was not ok');
      const payload = await res.json();
      if (payload.projects && payload.phrases) {
        setProjects(payload.projects);
        setPhrases(payload.phrases);
        setConnectionMode('online');
      } else {
        throw new Error('Invalid payload format');
      }
    } catch (err) {
      console.error("Failed to fetch from GAS:", err);
      // Fallback to offline on failure
      setConnectionMode('offline');
      setProjects(MOCK_PROJECTS);
      setPhrases(MOCK_PHRASES);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlGasId = searchParams.get('gas');
    
    let initialUrl = '';
    if (urlGasId) {
      if (!urlGasId.startsWith('http')) {
        initialUrl = `https://script.google.com/macros/s/${urlGasId}/exec`;
      } else {
        initialUrl = urlGasId;
      }
    } else {
      initialUrl = localStorage.getItem('pm_slack_gas_url') || '';
    }
    
    setGasUrl(initialUrl);
    fetchData(initialUrl);
  }, []);

  const handleProjectSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSelectedProject(value);
    const p = projects.find(x => x.name === value);
    if (p) {
      setProjectDeadline(p.deadline);
    }
  };

  const addNextStep = () => {
    setNextSteps(prev => [...prev, { id: crypto.randomUUID(), item: '', memo: '', format: '' }]);
  };

  const removeNextStep = (id: string) => {
    setNextSteps(prev => prev.filter(s => s.id !== id));
  };

  const updateNextStep = (id: string, field: keyof NextStep, value: string) => {
    setNextSteps(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const appendPhrase = (phraseText: string) => {
    if (!focusTarget) return;

    let finalPhrase = phraseText;
    const lowerPhrase = phraseText.toLowerCase();
    const today = new Date();

    if (lowerPhrase.includes('before the end of today')) {
      finalPhrase += ` ${today.getMonth() + 1}/${today.getDate()}`;
    } else if (lowerPhrase.includes('before the end of this week')) {
      const day = today.getDay();
      // Assume end of week is Friday (or Sunday if today is weekend). Let's just use Friday.
      const diff = today.getDate() - day + (day === 0 ? -2 : 5);
      const friday = new Date(today.setDate(diff));
      finalPhrase += ` ${friday.getMonth() + 1}/${friday.getDate()}`;
    } else if (lowerPhrase.includes('before the end of this month')) {
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      finalPhrase += ` ${lastDay.getMonth() + 1}/${lastDay.getDate()}`;
    }

    const append = (current: string) => {
      const trimmed = current.trimEnd();
      return trimmed ? `${trimmed} ${finalPhrase}` : finalPhrase;
    };

    if (focusTarget.type === 'projectDeadline') {
      setProjectDeadline(prev => append(prev));
    } else if (focusTarget.type === 'itemDeadline') {
      setItemDeadline(prev => append(prev));
    } else if (focusTarget.type === 'fileLocation') {
      setFileLocation(prev => append(prev));
    } else if (focusTarget.type === 'step') {
      setNextSteps(prev => prev.map(s => {
        if (s.id === focusTarget.id) {
          return { ...s, [focusTarget.field]: append(s[focusTarget.field]) };
        }
        return s;
      }));
    }
  };

  const categories = useMemo(() => {
    const cats = Array.from(new Set(phrases.map(p => p.category)));
    return cats.map(cat => ({
      name: cat,
      phrases: phrases.filter(p => p.category === cat).map(p => p.phrase)
    }));
  }, [phrases]);

  const generateOutput = () => {
    let output = '';
    
    if (selectedProject) output += `*Project Name:* ${selectedProject}\n`;
    if (projectDeadline) output += `*Project Deadline:* ${projectDeadline}\n`;
    if (itemDeadline) output += `*Item deadline:* ${itemDeadline}\n`;
    if (fileLocation) output += `*File Location:* ${fileLocation}\n`;
    
    if (nextSteps.length > 0 && nextSteps.some(s => s.item || s.memo || s.format)) {
      output += `*Next Step:*\n`;
      nextSteps.forEach((step, index) => {
        if (!step.item && !step.memo && !step.format) return;
        output += `${index + 1}.\n`;
        if (step.item) output += `Item: ${step.item}\n`;
        if (step.memo) output += `Memo: ${step.memo}\n`;
        if (step.format) output += `Format: ${step.format}\n`;
      });
    }

    if (includeSignature) {
      output += `\n\n${signatureText}`;
    }

    return output.trim();
  };

  const handleCopy = async () => {
    const text = generateOutput();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // Optional: log to GAS
      if (connectionMode === 'online' && gasUrl) {
         fetch(gasUrl, {
           method: 'POST',
           body: JSON.stringify({ action: 'log', userName: 'PM', messageContent: text }),
           mode: 'no-cors' // Use no-cors for simple fire-and-forget logging to avoid CORS errors if not configured perfectly
         }).catch(console.error);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("Failed to copy. Please manually select and copy the text.");
    }
  };

  const saveSettings = () => {
    let finalUrl = gasUrl.trim();
    if (finalUrl && !finalUrl.startsWith('http')) {
      finalUrl = `https://script.google.com/macros/s/${finalUrl}/exec`;
      setGasUrl(finalUrl);
    }
    localStorage.setItem('pm_slack_gas_url', finalUrl);
    setIsSettingsOpen(false);
    fetchData(finalUrl);
  };

  const outputText = generateOutput();

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-8 font-sans text-neutral-900 flex flex-col items-center">
      <div className="w-full max-w-7xl">
        <header className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Slack Task Generator</h1>
              {connectionMode === 'checking' && (
                <span className="flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Checking...
                </span>
              )}
              {connectionMode === 'online' && (
                <span className="flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span> 連線模式
                </span>
              )}
              {connectionMode === 'offline' && (
                <span className="flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 border border-neutral-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mr-1.5"></span> 離線模式
                </span>
              )}
            </div>
            <p className="text-sm text-neutral-500">Structured communication format for project tasks.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(!isSettingsOpen)}>
            <Settings className="w-4 h-4 mr-2" />
            設定
          </Button>
        </header>

        {isSettingsOpen && (
          <Card className="mb-6 bg-white border-blue-100 shadow-sm">
            <CardHeader className="py-4">
              <CardTitle className="text-base text-blue-900">Google Sheets 連線設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gas-url">Apps Script Web App URL 或 ID</Label>
                <div className="flex gap-2">
                  <Input 
                    id="gas-url" 
                    placeholder="https://script.google.com/... 或是直接輸入 ID"
                    value={gasUrl}
                    onChange={(e) => setGasUrl(e.target.value)}
                    className="max-w-xl"
                  />
                  <Button onClick={saveSettings}>儲存並連線</Button>
                </div>
                <p className="text-xs text-neutral-500">
                  清空此欄位即可使用「離線模式」(預設假資料)。<br/>
                  您也可以在網址加上參數快速連線：<code className="bg-neutral-100 px-1 py-0.5 rounded ml-1">?gas=您的GAS_ID</code>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            <span className="ml-2 text-neutral-500">Loading Configuration...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT COLUMN: Input Form */}
            <div className="lg:col-span-2 space-y-6 flex flex-col">
              
              <Card className="shadow-sm border-neutral-200/60">
                <CardHeader className="pb-3 border-b border-neutral-100 mb-4 bg-neutral-50/50 rounded-t-xl">
                  <CardTitle className="text-lg">Project Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Project</Label>
                      <Input 
                        list="project-list"
                        value={selectedProject} 
                        onChange={handleProjectSelect}
                        placeholder="Type or select a project"
                      />
                      <datalist id="project-list">
                        {projects.map(p => (
                          <option key={p.name} value={p.name} />
                        ))}
                      </datalist>
                    </div>

                    <div className="space-y-2">
                      <Label>Project Deadline</Label>
                      <Input 
                        value={projectDeadline} 
                        onChange={(e) => setProjectDeadline(e.target.value)}
                        onFocus={() => setFocusTarget({ type: 'projectDeadline' })}
                        placeholder="e.g. 5/19 all on air"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Item Deadline</Label>
                      <Input 
                        value={itemDeadline} 
                        onChange={(e) => setItemDeadline(e.target.value)}
                        onFocus={() => setFocusTarget({ type: 'itemDeadline' })}
                        placeholder="e.g. Before the end of this week 5/15"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>File Location</Label>
                      <Textarea 
                        value={fileLocation} 
                        onChange={(e) => setFileLocation(e.target.value)}
                        onFocus={() => setFocusTarget({ type: 'fileLocation' })}
                        placeholder="e.g. X:\Skysport_Vizday\Resource\Vizrt Days 3d Logo (1)"
                        className="resize-none h-16"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-neutral-200/60 flex-1 flex flex-col">
                <CardHeader className="pb-3 border-b border-neutral-100 flex flex-row items-center justify-between bg-neutral-50/50 rounded-t-xl">
                  <CardTitle className="text-lg">Next Steps</CardTitle>
                  <Button variant="outline" size="sm" onClick={addNextStep} className="h-8">
                    <Plus className="w-4 h-4 mr-1" />
                    New Item
                  </Button>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  {nextSteps.map((step, idx) => (
                    <div key={step.id} className="p-4 pt-5 rounded-xl border border-neutral-200 bg-white shadow-sm transition-all focus-within:border-blue-400 focus-within:ring-1 focus-within:ring-blue-100 relative">
                      
                      {/* Top Right Controls: Number & Delete */}
                      <div className="absolute top-3 right-3 flex items-center gap-1 bg-neutral-50 rounded-md border border-neutral-200 p-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] z-10">
                        <span className="text-xs font-bold text-neutral-500 px-1.5">#{idx + 1}</span>
                        <div className="w-px h-3 bg-neutral-200 mx-0.5"></div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 rounded-sm text-neutral-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => removeNextStep(step.id)}
                          disabled={nextSteps.length === 1}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1.5 pr-14">
                          <Label className="text-xs text-neutral-500 uppercase tracking-wider">Item (Task Name)</Label>
                          <Input 
                            value={step.item}
                            onChange={(e) => updateNextStep(step.id, 'item', e.target.value)}
                            onFocus={() => setFocusTarget({ type: 'step', id: step.id, field: 'item' })}
                            placeholder="e.g. Drone AR - Event Logo 3d"
                            className="font-medium bg-neutral-50/50"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs text-neutral-500 uppercase tracking-wider">Memo (Details)</Label>
                          <Textarea 
                            value={step.memo}
                            onChange={(e) => updateNextStep(step.id, 'memo', e.target.value)}
                            onFocus={() => setFocusTarget({ type: 'step', id: step.id, field: 'memo' })}
                            placeholder="e.g. use client's updated the 3d logo..."
                            className="resize-none min-h-[4rem]"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs text-neutral-500 uppercase tracking-wider">Format (Deliverable)</Label>
                          <Input 
                            value={step.format}
                            onChange={(e) => updateNextStep(step.id, 'format', e.target.value)}
                            onFocus={() => setFocusTarget({ type: 'step', id: step.id, field: 'format' })}
                            placeholder="e.g. Build in Viz / MP4 / PNG"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="shadow-sm border-neutral-200/60">
                <CardContent className="pt-4 flex flex-col gap-4">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="signature-toggle"
                      checked={includeSignature}
                      onChange={(e) => setIncludeSignature(e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <Label htmlFor="signature-toggle" className="cursor-pointer select-none">提醒回復 (Append Reminder)</Label>
                  </div>
                  {includeSignature && (
                    <Textarea 
                      value={signatureText}
                      onChange={(e) => setSignatureText(e.target.value)}
                      className="font-mono text-sm leading-relaxed min-h-[120px]"
                    />
                  )}
                </CardContent>
              </Card>

            </div>

            {/* RIGHT COLUMN: Quick Phrases & Output Preview */}
            <div className="space-y-6 flex flex-col h-full h-[100vh] lg:h-auto lg:max-h-[calc(100vh-6rem)] lg:sticky lg:top-8">
              
              <Card className="flex-1 flex flex-col shadow-sm border-neutral-200/60 overflow-hidden">
                <CardHeader className="pb-3 border-b border-neutral-100 bg-neutral-50/50">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Quick Phrases</CardTitle>
                    {focusTarget && <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full tracking-wider animate-in fade-in zoom-in duration-200">Ready to insert</span>}
                  </div>
                  <p className="text-xs text-neutral-500 pt-1">
                    Click any input field on the left, then click a phrase below to append it.
                  </p>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  <ScrollArea className="h-[300px] lg:h-full lg:max-h-[350px] w-full p-4">
                    <div className="space-y-6">
                      {categories.map((cat) => (
                        <div key={cat.name} className="space-y-2">
                          <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">{cat.name}</h4>
                          <div className="flex flex-wrap gap-2">
                            {cat.phrases.map((phrase, idx) => (
                              <button
                                key={idx}
                                onClick={() => appendPhrase(phrase)}
                                disabled={!focusTarget}
                                className={`text-sm px-3 py-1.5 rounded-md border text-left transition-all ${
                                  focusTarget 
                                    ? 'bg-white border-neutral-200 hover:border-blue-300 hover:bg-blue-50 text-neutral-700 hover:text-blue-800 shadow-sm' 
                                    : 'bg-neutral-50 border-neutral-100 text-neutral-400 cursor-not-allowed'
                                }`}
                              >
                                {phrase}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* OUTPUT SECTION */}
              <Card className="shadow-sm border-neutral-200/60 overflow-hidden flex flex-col h-[300px]">
                <CardHeader className="pb-2 border-b border-neutral-100 bg-neutral-50/50 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    Preview Output
                  </CardTitle>
                  <Button 
                    size="sm" 
                    onClick={handleCopy}
                    className={`transition-all ${copied ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  >
                    {copied ? (
                      <><CheckCheck className="w-4 h-4 mr-2" /> Copied</>
                    ) : (
                      <><Copy className="w-4 h-4 mr-2" /> Copy Slack Msg</>
                    )}
                  </Button>
                </CardHeader>
                <div className="p-0 flex-1 relative bg-neutral-900 border-t border-neutral-800">
                  <ScrollArea className="h-full w-full">
                    <pre className="p-4 text-[13px] leading-relaxed text-neutral-300 font-mono whitespace-pre-wrap">
                      {outputText || <span className="text-neutral-600 italic">Fill out the form to generate message...</span>}
                    </pre>
                  </ScrollArea>
                </div>
              </Card>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
