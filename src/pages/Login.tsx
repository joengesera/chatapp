import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "@/services/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Login = () => {
    const [isLoading, setIsLoading] = useState(false);
    const { setUser } = useAuthStore();
    const navigate = useNavigate();

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Check if user exists in Firestore
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                // Create new user
                await setDoc(userRef, {
                    uid: user.uid,
                    name: user.displayName,
                    email: user.email,
                    avatar: user.photoURL,
                    online: true,
                    createdAt: Date.now()
                });
            } else { // update online status
                await setDoc(userRef, { online: true }, { merge: true });
            }

            setUser({
                uid: user.uid,
                name: user.displayName || "User",
                email: user.email || "",
                avatar: user.photoURL || "",
                online: true
            });

            toast.success("Successfully logged in!");
            navigate("/");
        } catch (error: any) {
            console.error(error);
            toast.error("Login failed: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-muted/40">
            <div className="bg-background p-8 rounded-lg shadow-lg border w-full max-w-md text-center space-y-6">
                <div>
                    <h1 className="text-2xl font-bold">Welcome to Chat App</h1>
                    <p className="text-muted-foreground">Sign in to start messaging</p>
                </div>

                <div className="space-y-4">
                    <Button
                        variant="outline"
                        className="w-full h-12 text-lg"
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                        Sign in with Google
                    </Button>
                </div>
            </div>
        </div>
    );
};
