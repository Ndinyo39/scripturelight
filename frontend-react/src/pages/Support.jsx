import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, 
  ShieldCheck, 
  Globe, 
  Users, 
  Coffee, 
  Zap,
  CreditCard,
  ChevronRight,
  Smile,
  ExternalLink,
  Lock,
  Loader2,
  Smartphone
} from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import './Support.css';

const SUPPORT_TIERS = [
  { amount: 10, label: 'Supporter' },
  { amount: 25, label: 'Faithful' },
  { amount: 50, label: 'Advocat' },
  { amount: 100, label: 'Pillar' }
];

const IMPACT_CARDS = [
  {
    icon: <Globe size={32} />,
    title: "Global Reach",
    description: "Help us keep our servers running and the Word of God accessible to users in every nation, for free."
  },
  {
    icon: <Zap size={32} />,
    title: "Platform Growth",
    description: "Your support funds new features like audio bibles, children's study plans, and advanced tracking tools."
  },
  {
    icon: <Users size={32} />,
    title: "Community Programs",
    description: "Empowers us to provide resources for group leaders and facilitate global prayer networks."
  }
];

const Support = () => {
  const { user } = useAuth() || {};
  const [selectedAmount, setSelectedAmount] = useState(25);
  const [customAmount, setCustomAmount] = useState('');
  const [donationType, setDonationType] = useState('one-time');
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [phone, setPhone] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [mpesaError, setMpesaError] = useState('');

  const finalAmount = customAmount || selectedAmount;

  const handleApprove = (data, actions) => {
    return actions.order.capture().then((details) => {
      setShowThanks(true);
    });
  };

  const handleMpesaPayment = async () => {
    setIsProcessing(true);
    setMpesaError('');
    try {
      if (!phone || phone.length < 9) {
        throw new Error('Please enter a valid phone number');
      }
      await api.post('/mpesa/stkpush', {
         phone,
         amount: finalAmount,
         userId: user?.id
      });
      setShowThanks(true);
      setPhone('');
    } catch (err) {
      setMpesaError(err.message || 'M-Pesa payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="support-page">
      {/* ── HERO ── */}
      <section className="support-hero">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="d-flex justify-content-center mb-4">
               <div style={{ background: 'rgba(233, 196, 106, 0.2)', padding: '10px', borderRadius: '50%' }}>
                  <Heart fill="#e9c46a" color="#e9c46a" size={32} />
               </div>
            </div>
            <h1 className="support-title">Build the Future of <span className="gradient-text">Ministry</span></h1>
            <p className="support-subtitle">
              Your donation ensures that ScriptureLight remains free and accessible 
              to everyone, everywhere. Support our mission to digitize the Great Commission.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── DONATION BOX ── */}
      <section className="container">
        <motion.div 
          className="donation-card"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="donation-type-toggle">
            <button 
              className={`type-btn ${donationType === 'one-time' ? 'active' : ''}`}
              onClick={() => setDonationType('one-time')}
            >
              One-Time
            </button>
            <button 
              className={`type-btn ${donationType === 'monthly' ? 'active' : ''}`}
              onClick={() => setDonationType('monthly')}
            >
              Monthly
            </button>
          </div>

          <div className="amount-grid">
            {SUPPORT_TIERS.map((tier) => (
              <button 
                key={tier.amount}
                className={`amount-btn ${selectedAmount === tier.amount && !customAmount ? 'active' : ''}`}
                onClick={() => {
                  setSelectedAmount(tier.amount);
                  setCustomAmount('');
                }}
              >
                ${tier.amount}
                <span>{tier.label}</span>
              </button>
            ))}
          </div>

          <div className="custom-amount-wrapper">
            <span className="currency-symbol">$</span>
            <input 
              type="number" 
              className="custom-amount-input" 
              placeholder="Enter Custom Amount"
              value={customAmount}
              onChange={(e) => {
                setCustomAmount(e.target.value);
                setSelectedAmount(0);
              }}
            />
          </div>

          <div className="payment-method-toggle" style={{ display: 'flex', gap: '10px', marginTop: '1.5rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
             <button
               className={`btn-outline ${paymentMethod === 'paypal' ? 'active' : ''}`}
               onClick={() => setPaymentMethod('paypal')}
               style={{ padding: '8px 20px', borderRadius: '20px', background: paymentMethod === 'paypal' ? 'var(--primary-color)' : 'transparent', color: paymentMethod === 'paypal' ? '#fff' : 'var(--primary-color)' }}
             >
               <Coffee size={16} style={{ marginRight: '6px' }} /> PayPal
             </button>
             <button
               className={`btn-outline ${paymentMethod === 'mpesa' ? 'active' : ''}`}
               onClick={() => setPaymentMethod('mpesa')}
               style={{ padding: '8px 20px', borderRadius: '20px', background: paymentMethod === 'mpesa' ? '#4caf50' : 'transparent', color: paymentMethod === 'mpesa' ? '#fff' : '#4caf50', borderColor: '#4caf50' }}
             >
               <Smartphone size={16} style={{ marginRight: '6px' }} /> M-Pesa
             </button>
          </div>

          {paymentMethod === 'paypal' ? (
            <div className="paypal-container-wrapper">
              <PayPalScriptProvider options={{ "client-id": "AQj8ZE_v1NEgJfAmUzvvRVSkBqWRkNs-mPjyZEiW1iOkOsCYNXoqLC_CU8_FdIydKM8tr_sgI-tjcSnl", components: "buttons", currency: "USD" }}>
                 <PayPalButtons 
                   style={{ 
                     layout: "vertical",
                     color: "gold",
                     shape: "rect",
                     label: "donate"
                   }}
                   disabled={!finalAmount || finalAmount <= 0}
                   forceReRender={[finalAmount, donationType]}
                   createOrder={(data, actions) => {
                     return actions.order.create({
                       purchase_units: [
                         {
                           amount: {
                             value: finalAmount.toString(),
                           },
                           description: `${donationType === 'monthly' ? 'Monthly' : 'One-time'} donation to ScriptureLight`
                         },
                       ],
                     });
                   }}
                   onApprove={handleApprove}
                 />
              </PayPalScriptProvider>
            </div>
          ) : (
            <div className="mpesa-container-wrapper" style={{ marginTop: '1rem' }}>
               <input 
                 type="text" 
                 placeholder="M-Pesa Phone (e.g. 2547XXXXXXXX)" 
                 className="custom-amount-input" 
                 style={{ width: '100%', marginBottom: '15px' }}
                 value={phone}
                 onChange={(e) => setPhone(e.target.value)}
               />
               <button 
                 className="btn-primary w-100"
                 style={{ background: '#4caf50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                 onClick={handleMpesaPayment}
                 disabled={isProcessing || !finalAmount || !phone}
               >
                 {isProcessing ? <><Loader2 className="animate-spin" size={18} style={{ marginRight: '8px' }} /> Processing...</> : `Pay ${finalAmount} via M-Pesa`}
               </button>
               {mpesaError && <p className="text-danger mt-2 text-center" style={{ fontSize: '0.85rem', color: '#e74c3c' }}>{mpesaError}</p>}
            </div>
          )}

          <p className="text-center mt-4 text-muted" style={{ fontSize: '0.9rem' }}>
            <Lock size={14} style={{ marginRight: '4px' }} /> Secure, encrypted payments.
          </p>
        </motion.div>
      </section>

      {/* ── THANKS MODAL ── */}
      {showThanks && (
        <div className="modal-overlay">
           <motion.div 
             className="modal-content text-center p-5"
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
           >
              <div className="mb-4" style={{ color: 'var(--success)' }}>
                 <Smile size={80} />
              </div>
              <h2 className="mb-3">Thank You for Your Support!</h2>
              <p className="mb-4">
                Your generosity helps us keep the Word of God accessible to everyone globally. 
                {paymentMethod === 'mpesa' ? " Please check your phone for the M-Pesa prompt to enter your PIN." : " A confirmation has been sent to your email."}
              </p>
              <button className="btn-primary w-100" onClick={() => setShowThanks(false)}>
                Back to ScriptureLight
              </button>
           </motion.div>
        </div>
      )}

      {/* ── IMPACT ── */}
      <section className="impact-section">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="mb-3">Where Your Heart Goes</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: '600px' }}>
              We are committed to total transparency. Every dollar is used to advance 
              Bible literacy and build community among believers.
            </p>
          </div>

          <div className="impact-grid">
            {IMPACT_CARDS.map((card, idx) => (
              <motion.div 
                key={idx}
                className="impact-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="impact-icon">{card.icon}</div>
                <h3>{card.title}</h3>
                <p className="text-muted">{card.description}</p>
              </motion.div>
            ))}
          </div>

          <div className="security-badges">
             {/* Simple text representations of logos for branding */}
             <div className="d-flex align-items-center gap-2"><CreditCard size={24} /> VISA / MASTERCARD</div>
             <div className="d-flex align-items-center gap-2"><ShieldCheck size={24} /> SECURE SSL</div>
             <div className="d-flex align-items-center gap-2"><Coffee size={24} /> PAYPAL</div>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--white)', borderTop: '1px solid var(--gray-lighter)' }}>
         <div className="container text-center">
            <h2 className="mb-4">Become a Ministry Partner</h2>
            <p className="mb-5 text-muted mx-auto" style={{ maxWidth: '700px' }}>
              For organizations or donors interested in large-scale partnerships or sponsoring specific study plans, 
              please contact our legacy team directly at <span className="text-primary font-weight-bold">partnerships@scripturelight.com</span>
            </p>
            <button className="btn-outline">Contact Partnership Team</button>
         </div>
      </section>
    </div>
  );
};

export default Support;
