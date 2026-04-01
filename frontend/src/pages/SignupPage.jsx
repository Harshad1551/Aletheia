import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';
import { User, HeartHandshake, Check, Camera, X } from 'lucide-react';
import authService from '../services/authService';
import api from '../services/api';

const SignupPage = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [role, setRole] = useState('client');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        contact_number: '',
        password: '',
        confirmPassword: '',
        address: '',
        latitude: '',
        longitude: ''
    });

    // Profile picture state
    const [picFile, setPicFile] = useState(null);        // raw File object
    const [picPreview, setPicPreview] = useState(null);  // local blob URL for preview
    const [picUploading, setPicUploading] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [locationLoading, setLocationLoading] = useState(false);
    const [locationCaptured, setLocationCaptured] = useState(false);
    const [passwordCriteria, setPasswordCriteria] = useState({
        length: false,
        upper: false,
        lower: false,
        number: false,
        symbol: false
    });

    useEffect(() => {
        const pwd = formData.password;
        setPasswordCriteria({
            length: pwd.length >= 8,
            upper: /[A-Z]/.test(pwd),
            lower: /[a-z]/.test(pwd),
            number: /[0-9]/.test(pwd),
            symbol: /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
        });
    }, [formData.password]);

    // Cleanup blob URL when pic changes
    useEffect(() => {
        return () => {
            if (picPreview) URL.revokeObjectURL(picPreview);
        };
    }, [picPreview]);

    const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoleChange = (newRole) => {
        setRole(newRole);
        if (newRole === 'client') {
            setFormData(prev => ({ ...prev, address: '' }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPicFile(file);
        if (picPreview) URL.revokeObjectURL(picPreview);
        setPicPreview(URL.createObjectURL(file));
    };

    const handleRemovePic = () => {
        setPicFile(null);
        if (picPreview) URL.revokeObjectURL(picPreview);
        setPicPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleCaptureLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }
        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: pos.coords.latitude.toString(),
                    longitude: pos.coords.longitude.toString()
                }));
                setLocationCaptured(true);
                setLocationLoading(false);
            },
            () => {
                alert('Unable to retrieve your location. Please allow location access.');
                setLocationLoading(false);
            }
        );
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        if (!isPasswordValid) return;
        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        setIsLoading(true);
        let profilePictureUrl = null;

        try {
            // 1. Upload profile picture first (if selected)
            if (picFile) {
                setPicUploading(true);
                const form = new FormData();
                form.append('profile_picture', picFile);
                const uploadRes = await api.post('/upload/profile-picture', form, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                profilePictureUrl = uploadRes.data.url;
                setPicUploading(false);
            }

            // 2. Signup with the returned URL
            const payload = {
                name: formData.name,
                email: formData.email,
                contact_number: formData.contact_number,
                password: formData.password,
                role,
                profile_picture: profilePictureUrl,
                latitude: formData.latitude || null,
                longitude: formData.longitude || null,
            };
            if (role === 'therapist') {
                payload.address = formData.address || null;
            }

            await authService.signup(payload);

            if (role === 'therapist') {
                navigate('/therapist-dashboard');
            } else {
                navigate('/client-dashboard');
            }
        } catch (err) {
            console.error("Signup failed:", err);
            alert(err.message || "Signup failed. Please try again.");
        } finally {
            setIsLoading(false);
            setPicUploading(false);
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

            <div className="flex-grow flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 mt-16">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-[#111111]">
                            Create an account
                        </h2>
                        <p className="mt-2 text-[#6B6B6B]">
                            Start your journey with Aletheia.
                        </p>
                    </div>

                    <Card className="p-8 bg-white border border-[#111111]/10">
                        {/* Role Selection */}
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <button
                                type="button"
                                onClick={() => handleRoleChange('client')}
                                className={`p-4 rounded-sm border flex flex-col items-center gap-2 transition-all ${role === 'client'
                                    ? 'border-[#F5B94A] bg-[#F5B94A]/10 text-[#111111]'
                                    : 'border-[#111111]/20 hover:border-[#111111]/40 text-[#6B6B6B]'
                                    }`}
                            >
                                <User size={24} />
                                <span className="font-medium text-sm">I'm a Member</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleRoleChange('therapist')}
                                className={`p-4 rounded-sm border flex flex-col items-center gap-2 transition-all ${role === 'therapist'
                                    ? 'border-[#F5B94A] bg-[#F5B94A]/10 text-[#111111]'
                                    : 'border-[#111111]/20 hover:border-[#111111]/40 text-[#6B6B6B]'
                                    }`}
                            >
                                <HeartHandshake size={24} />
                                <span className="font-medium text-sm">I'm a Therapist</span>
                            </button>
                        </div>

                        <form onSubmit={handleSignup} className="space-y-4">
                            {/* Profile Picture Upload */}
                            <div className="flex flex-col items-center gap-3">
                                <div className="relative">
                                    {picPreview ? (
                                        <>
                                            <img
                                                src={picPreview}
                                                alt="Preview"
                                                className="w-20 h-20 rounded-full object-cover border-2 border-[#F5B94A]/30 shadow"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleRemovePic}
                                                className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center shadow hover:bg-red-600 transition-colors"
                                            >
                                                <X size={10} />
                                            </button>
                                        </>
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-[#F5EDE4] border-2 border-[#111111]/20 flex items-center justify-center text-[#6B6B6B]">
                                            <User size={32} />
                                        </div>
                                    )}
                                </div>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-[#F5B94A] border border-[#F5B94A] rounded-sm hover:bg-[#F5B94A]/10 transition-colors"
                                >
                                    <Camera size={14} />
                                    {picPreview ? 'Change Photo' : 'Upload Photo'}
                                </button>
                                <p className="text-xs text-[#6B6B6B]">JPG, PNG, WebP or GIF · Max 5 MB</p>
                            </div>

                            <Input
                                label="Full Name"
                                name="name"
                                placeholder="John Doe"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />

                            <Input
                                label="Email address"
                                type="email"
                                name="email"
                                placeholder="you@example.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />

                            <Input
                                label="Contact Number"
                                type="tel"
                                name="contact_number"
                                placeholder="1234567890"
                                value={formData.contact_number}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, ''); // Allow only digits
                                    if (val.length <= 10) {
                                        setFormData({ ...formData, contact_number: val });
                                    }
                                }}
                                pattern="[0-9]{10}"
                                title="Contact number must be exactly 10 digits"
                                required
                            />

                            <div>
                                <Input
                                    label="Password"
                                    type="password"
                                    name="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <div className="mt-3 grid grid-cols-2 gap-y-1 pl-1">
                                    <Criterion met={passwordCriteria.length} label="Min 8 chars" />
                                    <Criterion met={passwordCriteria.upper} label="Uppercase" />
                                    <Criterion met={passwordCriteria.lower} label="Lowercase" />
                                    <Criterion met={passwordCriteria.number} label="Number" />
                                    <Criterion met={passwordCriteria.symbol} label="Symbol (!@#$)" />
                                </div>
                            </div>

                            <Input
                                label="Confirm Password"
                                type="password"
                                name="confirmPassword"
                                placeholder="••••••••"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                            />

                            {/* Location Capture */}
                            <div>
                                <p className="text-sm font-medium text-[#111111] mb-2">Location</p>
                                <button
                                    type="button"
                                    onClick={handleCaptureLocation}
                                    disabled={locationLoading || locationCaptured}
                                    className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-sm border text-sm font-medium transition-all
                                        ${locationCaptured
                                            ? 'border-[#7CBDB6] bg-[#7CBDB6]/10 text-[#7CBDB6] cursor-default'
                                            : 'border-[#111111]/20 hover:border-[#F5B94A] text-[#6B6B6B] hover:text-[#111111]'
                                        }`}
                                >
                                    {locationLoading ? '📍 Detecting...'
                                        : locationCaptured ? <><Check size={14} /> Location captured</>
                                            : '📍 Capture my location'}
                                </button>
                                {locationCaptured && (
                                    <p className="text-xs text-[#6B6B6B] mt-1 pl-1">
                                        Lat: {parseFloat(formData.latitude).toFixed(4)}, Lng: {parseFloat(formData.longitude).toFixed(4)}
                                    </p>
                                )}
                            </div>

                            {/* Address — Therapist only */}
                            {role === 'therapist' && (
                                <Input
                                    label="Clinic / Practice Address"
                                    name="address"
                                    placeholder="123 Wellness St, City, State"
                                    value={formData.address}
                                    onChange={handleChange}
                                />
                            )}

                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    className="w-full text-lg"
                                    disabled={isLoading || picUploading || !isPasswordValid}
                                >
                                    {picUploading ? 'Uploading photo...' : isLoading ? 'Creating account...' : 'Create Account'}
                                </Button>
                            </div>
                        </form>

                        <div className="mt-8 text-center text-sm text-[#6B6B6B]">
                            Already have an account?{' '}
                            <Link to="/login" className="font-medium text-[#F5B94A] hover:text-[#111111]">
                                Log in
                            </Link>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
