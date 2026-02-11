import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EmailOtpVerification } from "@/components/emailOtpVerification";
import {
    useRequestPasswordResetOTPMutation,
    useVerifyPasswordResetOTPMutation,
    useResetPasswordMutation,
} from "@/redux/apis/userApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { isValidPassword } from "@/utils/password";

export default function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [step, setStep] = useState(1);

    const [requestOtp] = useRequestPasswordResetOTPMutation();
    const [verifyOtp] = useVerifyPasswordResetOTPMutation();
    const [resetPassword, { isLoading: isResetting }] =
        useResetPasswordMutation();

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleVerified = () => {
        setStep(2);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setPasswordError("");

        if (newPassword !== confirmPassword) {
            setPasswordError("Passwords do not match");
            return;
        }

        if (!isValidPassword(newPassword)) {
            setPasswordError(
                "Password must be at least 8 characters and include one letter and one number"
            );
            return;
        }

        try {
            await resetPassword({
                email,
                newPassword,
            }).unwrap();

            navigate("/login");
        } catch (err) {
            console.error(err);
            setPasswordError(
                err?.data?.message || "Failed to reset password"
            );
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {step === 1
                            ? "Forgot Password"
                            : "Reset Password"}
                    </h1>
                    <p className="text-sm text-gray-500 mt-2">
                        {step === 1
                            ? "Enter your email to receive a verification code"
                            : "Create a new password for your account"}
                    </p>
                </div>

                {step === 1 && (
                    <EmailOtpVerification
                        email={email}
                        setEmail={setEmail}
                        sendOtp={requestOtp}
                        verifyOtp={verifyOtp}
                        onVerified={handleVerified}
                    />
                )}

                {step === 2 && (
                    <form
                        onSubmit={handleResetPassword}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                New Password
                            </label>
                            <div className="relative">
                                <Input
                                    type={
                                        showNewPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={newPassword}
                                    onChange={(e) =>
                                        setNewPassword(e.target.value)
                                    }
                                    required
                                    placeholder="Enter new password"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowNewPassword((v) => !v)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                >
                                    {showNewPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>

                            {newPassword &&
                                !isValidPassword(newPassword) && (
                                    <p className="text-xs text-red-500">
                                        Password must be at least 8
                                        characters and include one letter and
                                        one number
                                    </p>
                                )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <Input
                                    type={
                                        showConfirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    value={confirmPassword}
                                    onChange={(e) =>
                                        setConfirmPassword(e.target.value)
                                    }
                                    required
                                    placeholder="Confirm new password"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword((v) => !v)
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {passwordError && (
                            <p className="text-sm text-red-600">
                                {passwordError}
                            </p>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isResetting}
                        >
                            {isResetting && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Reset Password
                        </Button>
                    </form>
                )}

                <div className="text-center">
                    <Link
                        to="/login"
                        className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
