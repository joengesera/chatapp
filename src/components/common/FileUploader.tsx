import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, File as FileIcon, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFileUpload } from "@/hooks/useFileUpload";

interface FileUploaderProps {
    onUploadComplete: (url: string, type: 'image' | 'file', name: string) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const FileUploader = ({ onUploadComplete, open, onOpenChange }: FileUploaderProps) => {
    const { uploadFile, uploading, progress, error } = useFileUpload();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles?.[0]) {
            setSelectedFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxSize: 20 * 1024 * 1024, // 20MB
        multiple: false
    });

    const handleUpload = async () => {
        if (!selectedFile) return;

        try {
            const url = await uploadFile(selectedFile);
            const type = selectedFile.type.startsWith('image/') ? 'image' : 'file';
            onUploadComplete(url, type, selectedFile.name);
            setSelectedFile(null);
            onOpenChange(false);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Upload File</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    {!selectedFile ? (
                        <div
                            {...getRootProps()}
                            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${isDragActive ? "border-primary bg-muted" : "border-muted-foreground/25 hover:border-primary"}`}
                        >
                            <input {...getInputProps()} />
                            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-sm text-muted-foreground">
                                Drag & drop a file here, or click to select
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Max 20MB (Images, PDF, Docs)
                            </p>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50 relative">
                            <FileIcon className="h-8 w-8 text-primary" />
                            <div className="flex-1 overflow-hidden">
                                <p className="font-medium truncate">{selectedFile.name}</p>
                                <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                            {!uploading && (
                                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    )}

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}

                    {uploading && (
                        <div className="space-y-2">
                            <div className="h-2 bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                            </div>
                            <p className="text-xs text-center text-muted-foreground">{Math.round(progress)}% Uploading...</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading}>Cancel</Button>
                        <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
                            {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            Upload
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
