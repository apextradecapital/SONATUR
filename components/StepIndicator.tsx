
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
    { id: SubscriptionStep.PROGRAM, label: "Programme" },
    { id: SubscriptionStep.PARCEL, label: "Parcelle" },
    { id: SubscriptionStep.RECAP, label: "Récapitulatif" },
    { id: SubscriptionStep.PAYMENT, label: "Paiement" },
  ];

  return (
    <div className="w-full px-4 py-4 bg-white shadow-sm mb-4">
      <div className="flex items-center justify-between max-w-2xl mx-auto relative">
        {/* Connecting Line */}
        <div className="absolute left-0 top-[15px] transform w-full h-1 bg-gray-200 -z-10" />
        
        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          
          return (
            <div key={step.id} className="flex flex-col items-center bg-white px-1">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 border-2 
                  ${isCompleted ? 'bg-green-600 border-green-600 text-white' : 
                    isCurrent ? 'bg-white border-green-600 text-green-600' : 'bg-gray-100 border-gray-300 text-gray-400'}`}
              >
                {isCompleted ? <Check size={16} /> : step.id + 1}
              </div>
              <span className={`text-[10px] mt-1 font-medium text-center hidden sm:block ${isCurrent ? 'text-green-700' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      {/* Mobile Label */}
      <div className="text-center text-sm font-bold text-green-700 mt-2 sm:hidden">
        {steps.find(s => s.id === currentStep)?.label || "Terminé"}
      </div>
    </div>
  );
};

export default StepIndicator;
