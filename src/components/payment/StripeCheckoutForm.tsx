import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { AlertCircle, CheckCircle } from "lucide-react";

interface StripeCheckoutFormProps {
  amount: number;
  projectId: string;
  tonnes: number;
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

export const StripeCheckoutForm = ({
  amount,
  projectId,
  tonnes,
  userId,
  onSuccess,
  onCancel,
  isLoading: parentLoading,
}: StripeCheckoutFormProps) => {
  const [stripe, setStripe] = useState<any>(null);
  const [cardElement, setCardElement] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);

  // Initialize Stripe
  useEffect(() => {
    if (!(globalThis as any).Stripe) {
      toast.error("Stripe is not loaded. Please refresh the page.");
      return;
    }

    const stripeInstance = (globalThis as any).Stripe(
      import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    );
    setStripe(stripeInstance);

    // Create and mount card element
    const elements = stripeInstance.elements();
    const card = elements.create("card", {
      style: {
        base: {
          fontSize: "14px",
          color: "#32325d",
          fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
          textColor: "#000",
          "::placeholder": {
            color: "#aab7c4",
          },
        },
        invalid: {
          color: "#fa755a",
        },
      },
      classes: {
        focus: "focus",
        complete: "complete",
      },
    });

    const cardElement = document.getElementById("stripe-card-element");
    if (cardElement && !cardElement.hasChildNodes()) {
      card.mount("#stripe-card-element");
      setCardElement(card);
    }

    return () => {
      // Unmount card element on cleanup
      try {
        card.unmount();
      } catch (e) {
        // Already unmounted
      }
    };
  }, []);

  const handlePayment = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!stripe || !cardElement) {
      toast.error("Card element not loaded. Please refresh the page.");
      return;
    }

    setIsLoading(true);

    try {
      // Create payment method from card element
      const paymentMethodResult = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
      });

      if (paymentMethodResult.error) {
        toast.error("Card error: " + paymentMethodResult.error.message);
        setIsLoading(false);
        return;
      }

      // Create payment intent on the server
      const response = await fetch(
  `${import.meta.env.VITE_API_BASE_URL}/create-payment-intent`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: Math.round(amount * 100),
      currency: "USD",
      projectId,
      tonnes,
      userId,
    }),
  }
);


      const data = await response.json();

      if (!data.success || !data.clientSecret) {
        toast.error("Failed to create payment intent");
        setIsLoading(false);
        return;
      }

      // Confirm the payment
      const confirmResult = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: paymentMethodResult.paymentMethod.id,
      });

      if (confirmResult.error) {
        toast.error("Payment failed: " + confirmResult.error.message);
        setIsLoading(false);
        return;
      }

      if (confirmResult.paymentIntent?.status === "succeeded") {
        setPaymentMethod(paymentMethodResult.paymentMethod.id);
        toast.success("Payment successful!");
        setIsLoading(false);
        // Call onSuccess after a brief delay to show success message
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else if (confirmResult.paymentIntent?.status === "requires_action") {
        // 3D Secure or other authentication required
        toast.error("Additional verification required. Please check your card.");
        setIsLoading(false);
      } else {
        toast.error("Unexpected payment status: " + confirmResult.paymentIntent?.status);
        setIsLoading(false);
      }
    } catch (err) {
      toast.error("Payment error: " + (err as Error).message);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 rounded-lg bg-muted/50 border border-border">
      <div className="space-y-3">
        <h4 className="font-semibold text-sm">Payment Details</h4>

        {/* Demo Test Card Info */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
          <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <div className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
            <p className="font-medium">Demo Test Card (Use for Testing)</p>
            <p><span className="font-mono">4242 4242 4242 4242</span> - succeeds</p>
            <p><span className="font-mono">4000 0025 0000 3155</span> - 3D Secure required</p>
            <p>Any future expiry date and any 3-digit CVC</p>
          </div>
        </div>

        {/* Amount to Pay */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Amount to pay:</span>
          <span className="font-bold text-lg text-gradient">${amount.toFixed(2)}</span>
        </div>

        {/* Card Element */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Card Details</label>
          <div
            id="stripe-card-element"
            className="border border-input rounded-md p-4 bg-background hover:border-primary/50 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all"
          />
        </div>

        {/* Payment Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handlePayment}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            disabled={isLoading || parentLoading || paymentMethod !== null}
          >
            {isLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </>
            ) : paymentMethod ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Payment Successful
              </>
            ) : (
              "Complete Payment"
            )}
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1"
            disabled={isLoading || parentLoading}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};
