
import React, { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Mail, Lock, AlertCircle } from "lucide-react";

const Auth: React.FC = () => {
  const { isAuthenticated, login, loginWithEmail, signUpWithEmail, resetPassword, updatePassword, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
    // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [forgotPassword, setForgotPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");
  
  // Check if this is a password reset flow
  const isPasswordReset = searchParams.get('type') === 'recovery' || searchParams.get('mode') === 'reset';

  // If user is authenticated and NOT in password reset mode, redirect to projects
  if (isAuthenticated && !isPasswordReset) {
    return <Navigate to="/projects" replace />;
  }

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  // Handle sign in
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!validatePassword(password)) {
      setError("Password must be at least 6 characters");
      return;
    }

    setAuthLoading(true);
    try {
      await loginWithEmail(email, password);
    } catch (error: any) {
      setError(error.message || "Failed to sign in");
    } finally {
      setAuthLoading(false);
    }
  };
  // Handle sign up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    if (!validatePassword(password)) {
      setError("Password must be at least 6 characters");
      return;
    }    setAuthLoading(true);
    try {
      await signUpWithEmail(email, password);
      setSuccess("If this email is new, please check your email for verification. If you already have an account, please sign in instead.");
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        setError("An account with this email already exists. Please sign in instead or use the 'Forgot password?' link if you've forgotten your password.");
      } else {
        setError(error.message || "Failed to create account");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setAuthLoading(true);
    try {
      await resetPassword(email);
      setSuccess("Password reset email sent! Please check your inbox.");
    } catch (error: any) {
      setError(error.message || "Failed to send reset email");
    } finally {
      setAuthLoading(false);
    }
  };
  // Handle password update (for reset flow)
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validatePassword(newPassword)) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match");
      return;
    }

    setAuthLoading(true);
    try {
      await updatePassword(newPassword);
      setSuccess("Password updated successfully! You can now sign in with your new password.");
      // Redirect to projects after successful password update
      setTimeout(() => {
        window.location.href = "/projects";
      }, 2000);
    } catch (error: any) {
      setError(error.message || "Failed to update password");
    } finally {
      setAuthLoading(false);
    }
  };  // Reset form state when switching tabs
  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setError("");
    setSuccess("");
    setForgotPassword(false);
  };

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    resetForm();
  };

  // Get dynamic title and description based on current state
  const getTitle = () => {
    if (isPasswordReset) return "Reset Your Password";
    if (activeTab === "signup") return "Create Account";
    return "Welcome back";
  };

  const getDescription = () => {
    if (isPasswordReset) return "Enter your new password below";
    if (activeTab === "signup") return "Create your account to get started";
    return "Sign in to your account or create a new one";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-primary">Orygin Eval</h1>
          <p className="text-muted-foreground">
            Evaluate your LLM performance with confidence
          </p>
        </div>        <Card className="orygin-card">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {getTitle()}
            </CardTitle>
            <CardDescription className="text-center">
              {getDescription()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Error/Success Messages */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {/* Password Reset Form */}
            {isPasswordReset ? (
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-9 pr-9"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-new-password"
                      type={showConfirmNewPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="pl-9 pr-9"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    >
                      {showConfirmNewPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={authLoading}
                >
                  {authLoading ? "Updating password..." : "Update Password"}
                </Button>
              </form>
            ) : (
              <>            {/* Email/Password Authentication */}
            <Tabs defaultValue="signin" className="w-full" onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {/* Sign In Tab */}
              <TabsContent value="signin" className="space-y-4">
                {!forgotPassword ? (
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signin-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>                    <div className="space-y-2">
                      <Label htmlFor="signin-password">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="signin-password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pl-9 pr-9"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="flex justify-end pt-1">
                        <Button
                          type="button"
                          variant="link"
                          className="px-0 text-sm h-auto py-0"
                          onClick={() => setForgotPassword(true)}
                        >
                          Forgot password?
                        </Button>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full mt-6" 
                      disabled={authLoading}
                    >
                      {authLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                ) : (
                  // Forgot Password Form
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-semibold">Reset Password</h3>
                      <p className="text-sm text-muted-foreground">
                        Enter your email address and we'll send you a reset link
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reset-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-9"
                          required
                        />
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => setForgotPassword(false)}
                      >
                        Back
                      </Button>
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={authLoading}
                      >
                        {authLoading ? "Sending..." : "Send Reset Link"}
                      </Button>
                    </div>
                  </form>
                )}
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-9"
                        required
                      />
                    </div>
                  </div>                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9 pr-9"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full mt-6" 
                    disabled={authLoading}
                  >
                    {authLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>            
              </Tabs>            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google OAuth Button */}
            <Button 
              onClick={login} 
              disabled={isLoading || authLoading}
              className="w-full bg-card hover:bg-card/80 border border-border flex items-center justify-center gap-3 py-6"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 488 512" 
                className="h-5 w-5"
                fill="currentColor"
              >
                <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
              </svg>
              {isLoading ? "Logging in..." : "Continue with Google"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </div>
            </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
