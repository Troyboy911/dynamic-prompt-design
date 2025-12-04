import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface ConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  name: string;
  configJson: string;
  status: string;
  itemType: 'scraper' | 'automation' | 'protocol' | 'tool';
  onSave: (name: string, config: string, status: string) => Promise<void>;
  isSaving: boolean;
}

export const ConfigModal = ({
  open,
  onOpenChange,
  title,
  description,
  name: initialName,
  configJson,
  status: initialStatus,
  itemType,
  onSave,
  isSaving
}: ConfigModalProps) => {
  const [name, setName] = useState(initialName);
  const [config, setConfig] = useState(configJson);
  const [status, setStatus] = useState(initialStatus);

  const handleSave = async () => {
    await onSave(name, config, status);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="config-name">Name</Label>
            <Input
              id="config-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`${itemType} name`}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="config-status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="config-json">Configuration (JSON)</Label>
            <Textarea
              id="config-json"
              value={config}
              onChange={(e) => setConfig(e.target.value)}
              placeholder='{"key": "value"}'
              rows={10}
              className="font-mono text-sm"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface RunModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  itemName: string;
  itemType: string;
  onRun: () => Promise<void>;
  isRunning: boolean;
  result?: string;
}

export const RunModal = ({
  open,
  onOpenChange,
  title,
  itemName,
  itemType,
  onRun,
  isRunning,
  result
}: RunModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Execute {itemType}: {itemName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {!result && !isRunning && (
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
              <p className="text-sm">
                Click "Run Now" to execute this {itemType}. The AI agent will process the task based on the current configuration.
              </p>
            </div>
          )}
          {isRunning && (
            <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30 flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-yellow-400" />
              <p className="text-sm text-yellow-400">Executing {itemType}...</p>
            </div>
          )}
          {result && (
            <div className="space-y-2">
              <Label>Execution Result:</Label>
              <div className="p-4 bg-secondary/20 rounded-lg max-h-60 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap">{result}</pre>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {!result && (
            <Button onClick={onRun} disabled={isRunning} className="glow-effect">
              {isRunning && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isRunning ? 'Running...' : 'Run Now'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface DeleteConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemType: string;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export const DeleteConfirmModal = ({
  open,
  onOpenChange,
  itemName,
  itemType,
  onConfirm,
  isDeleting
}: DeleteConfirmModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {itemType}?</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{itemName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
