import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { User, HeartHandshake, Check, AlertTriangle } from 'lucide-react';
import authService from '../services/authService';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [role, setRole] = useState('client');
    const [email, setEmail] = useState('');
    const [contact_number, setContactNumber] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionExpired, setSessionExpired] = useState(false);
    const [loginError, setLoginError] = useState(null);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('reason') === 'expired') setSessionExpired(true);
    }, [location.search]);

    const [passwordCriteria, setPasswordCriteria] = useState({ length: false, upper: false, lower: false, number: false, symbol: false });

    useEffect(() => {
        setPasswordCriteria({ length: password.length >= 8, upper: /[A-Z]/.test(password), lower: /[a-z]/.test(password), number: /[0-9]/.test(password), symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password) });
    }, [password]);

    const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!isPasswordValid) return;
        setIsLoading(true);
        setLoginError(null);
        try {
            const data = await authService.login({ email, password });
            const actualRole = data?.user?.role;
            if (actualRole !== role) {
                authService.logout();
                const actualLabel = actualRole === 'therapist' ? 'Therapist' : 'Member';
                setLoginError(`This account is registered as a ${actualLabel}. Please select the "${actualLabel}" option to sign in.`);
                return;
            }
            navigate(actualRole === 'therapist' ? '/therapist-dashboard' : '/client-dashboard', { replace: true });
        } catch (err) {
            console.error('Login failed:', err);
            setLoginError(err || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    const Criterion = ({ met, label }) => (
        <div className={`flex items-center gap-2 text-xs transition-colors ${met ? 'text-[#7CBDB6]' : 'text-[#6B6B6B]'}`}>
            {met ? <Check size={12} /> : <div className="w-3 h-3 rounded-full border border-[#6B6B6B]"></div>}
            <span>{label}</span>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F5EDE4] flex flex-col">
            <Navbar />
            <div className="flex-grow flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
                <div className="w-full max-w-md">
                    {sessionExpired && (
                        <div className="mb-6 flex items-start gap-3 bg-[#F5B94A]/10 border border-[#F5B94A] text-[#111111] rounded-sm px-4 py-3 text-sm">
                            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[#F5B94A]" />
                            <div className="flex-1">
                                <p className="font-semibold">Session expired</p>
                                <p className="text-[#6B6B6B]">Your session has expired. Please sign in again.</p>
                            </div>
                            <button onClick={() => setSessionExpired(false)} className="text-[#6B6B6B] hover:text-[#111111] ml-2">&times;</button>
                        </div>
                    )}

                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-[#111111]">Welcome back</h2>
                        <p className="mt-2 text-[#6B6B6B]">Please enter your details to sign in.</p>
                    </div>

                    <Card className="p-8 bg-white border border-[#111111]/10">
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <button type="button" onClick={() => { setRole('client'); setLoginError(null); }}
                                className={`p-3 rounded-sm border flex flex-col items-center gap-1 transition-all ${role === 'client' ? 'border-[#F5B94A] bg-[#F5B94A]/10 text-[#111111]' : 'border-[#111111]/20 hover:border-[#111111]/40 text-[#6B6B6B]'}`}>
                                <User size={20} />
                                <span className="font-medium text-xs">Member</span>
                            </button>
                            <button type="button" onClick={() => { setRole('therapist'); setLoginError(null); }}
                                className={`p-3 rounded-sm border flex flex-col items-center gap-1 transition-all ${role === 'therapist' ? 'border-[#F5B94A] bg-[#F5B94A]/10 text-[#111111]' : 'border-[#111111]/20 hover:border-[#111111]/40 text-[#6B6B6B]'}`}>
                                <HeartHandshake size={20} />
                                <span className="font-medium text-xs">Therapist</span>
                            </button>
                        </div>

                        {loginError && (
                            <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-sm px-4 py-3 text-sm">
                                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-500" />
                                <div className="flex-1">{loginError}</div>
                                <button onClick={() => setLoginError(null)} className="text-red-400 hover:text-red-600 ml-2">&times;</button>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-6">
                            <Input label="Email address/Contact Number" type="text" placeholder="you@example.com or 1234567890"
                                value={email}
                                onChange={(e) => {
                                    let val = e.target.value;
                                    if (/^\d+$/.test(val)) { if (val.length > 10) val = val.slice(0, 10); }
                                    setEmail(val);
                                    setContactNumber(val);
                                }}
                                required />

                            <div>
                                <Input label="Password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                <div className="mt-3 grid grid-cols-2 gap-y-1 pl-1">
                                    <Criterion met={passwordCriteria.length} label="Min 8 chars" />
                                    <Criterion met={passwordCriteria.upper} label="Uppercase" />
                                    <Criterion met={passwordCriteria.lower} label="Lowercase" />
                                    <Criterion met={passwordCriteria.number} label="Number" />
                                    <Criterion met={passwordCriteria.symbol} label="Symbol (!@#$)" />
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center text-[#6B6B6B] cursor-pointer">
                                    <input type="checkbox" className="mr-2 rounded border-[#111111]/30" />
                                    Remember me
                                </label>
                                <a href="#" className="font-medium text-[#F5B94A] hover:text-[#111111]">Forgot password?</a>
                            </div>

                            <Button type="submit" className="w-full text-lg" disabled={isLoading || !isPasswordValid}>
                                {isLoading ? 'Signing in...' : 'Sign in'}
                            </Button>
                        </form>

                        <div className="mt-8 text-center text-sm text-[#6B6B6B]">
                            Don't have an account?{' '}
                            <Link to="/signup" className="font-medium text-[#F5B94A] hover:text-[#111111]">Sign up for free</Link>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
