
import React from 'react';
import { SubscriptionStep } from '../types';
import { Check } from 'lucide-react';

interface StepIndicatorProps {
  currentStep: SubscriptionStep;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const steps = [
    { id: SubscriptionStep.CONDITIONS, label: "Conditions" },
    { id: SubscriptionStep.IDENTIFICATION, label: "Identité" },
    { id: SubscriptionStep.SITE_SELECTION, label: "Site" },
    { id: SubscriptionStep.PARCEL_LIST, label: "Parcelle" },
    { id: SubscriptionStep.RECAP, label: "Récap" },
    { id: SubscriptionStep.PAYMENT, label: "Paiement" },
  ];

  return (
    <div className="w-full px-2 py-4 bg-white shadow-sm mb-4 overflow-x-auto">
      <div className="flex items-center justify-between min-w-[320px] max-w-2xl mx-auto relative px-4">
        {/* Connecting Line */}
        <div className="absolute left-4 right-4 top-[15px] h-0.5 bg-gray-200 -z-10" />
        
        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          
          return (
            <div key={step.id} className="flex flex-col items-center bg-white px-1">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 border-2 
                  ${isCompleted ? 'bg-[#009640] border-[#009640] text-white' : 
                    isCurrent ? 'bg-white border-[#009640] text-[#009640]' : 'bg-gray-100 border-gray-300 text-gray-400'}`}
              >
                {isCompleted ? <Check size={16} /> : step.id + 1}
              </div>
              <span className={`text-[9px] sm:text-[10px] mt-1 font-medium whitespace-nowrap ${isCurrent ? 'text-[#009640]' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
