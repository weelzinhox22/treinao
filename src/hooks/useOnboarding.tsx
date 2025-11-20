import { useState, useEffect } from "react";

const ONBOARDING_KEY = "onboarding_completed";

export const useOnboarding = () => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const completed = localStorage.getItem(ONBOARDING_KEY) === "true";
    setIsCompleted(completed);
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setIsCompleted(true);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    setIsCompleted(false);
    setCurrentStep(0);
  };

  return {
    isCompleted,
    currentStep,
    setCurrentStep,
    completeOnboarding,
    resetOnboarding,
  };
};

