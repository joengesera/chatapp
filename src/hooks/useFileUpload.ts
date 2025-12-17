import { useState } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/services/firebase";
import { v4 as uuidv4 } from "uuid";

export const useFileUpload = () => {
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const uploadFile = async (file: File, path: string = "uploads"): Promise<string> => {
        setUploading(true);
        setError(null);
        setProgress(0);

        return new Promise((resolve, reject) => {
            const fileExtension = file.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExtension}`;
            const storageRef = ref(storage, `${path}/${fileName}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                "state_changed",
                (snapshot) => {
                    const progressValue = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setProgress(progressValue);
                },
                (err) => {
                    setError(err.message);
                    setUploading(false);
                    reject(err);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    setUploading(false);
                    resolve(downloadURL);
                }
            );
        });
    };

    return { uploadFile, uploading, progress, error };
};
