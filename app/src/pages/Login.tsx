
import React, { useState } from 'react';
import { LoginForm, SignupForm } from '@/components/AuthForms';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Login = () => {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  const toggleForm = () => {
    setActiveTab(activeTab === 'login' ? 'signup' : 'login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <GovernmentLogo className="h-10 w-10 text-gov-blue" />
            <h1 className="text-2xl font-bold text-gov-blue">MOSDAC Assist</h1>
          </div>
        </div>
        
        <Card className="border-gray-200 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl text-center">
              Welcome to MOSDAC Assist
            </CardTitle>
            <CardDescription className="text-center">
              Please login to access the chatbot assistant
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'signup')}>
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Create Account</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <LoginForm onToggle={toggleForm} />
              </TabsContent>
              <TabsContent value="signup">
                <SignupForm onToggle={toggleForm} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <p className="text-center text-sm text-muted-foreground mt-4">
          By using this service, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

const GovernmentLogo = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M3 21H21M3 18H21M6 18V9.5M10 18V9.5M14 18V9.5M18 18V9.5M21 9.5L12 3L3 9.5" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export default Login;
