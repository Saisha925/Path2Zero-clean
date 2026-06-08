import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Shield, ShoppingCart } from "lucide-react";
import { toast } from "sonner";

interface ProjectCardProps {
  id: string;
  title: string;
  description: string;
  image: string;
  pricePerTonne: number;
  country: string;
  category: string;
  vintage: number;
  verified: boolean;
}

export const ProjectCard = ({
  id,
  title,
  description,
  image,
  pricePerTonne,
  country,
  category,
  vintage,
  verified,
}: ProjectCardProps) => {
  const [tonnes, setTonnes] = useState(1);
  const [showPayment, setShowPayment] = useState(false);

  const handlePaymentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPayment(true);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!tonnes || tonnes < 1) {
      toast.error("Please enter a valid quantity");
      return;
    }

    const totalPrice = pricePerTonne * tonnes;
    toast.info(`${tonnes} tonnes × $${pricePerTonne.toFixed(2)} = $${totalPrice.toFixed(2)}`, {
      description: "Redirecting to checkout...",
    });
    
    // Redirect to retire page where full payment form is available
    globalThis.location.href = `/marketplace/${id}`;
  };

  return (
    <Link to={`/marketplace/${id}`}>
      <article className="group glass-card rounded-2xl overflow-hidden card-hover cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className="aspect-[4/3] overflow-hidden relative">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {verified && (
            <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-primary/90 text-primary-foreground text-xs font-medium flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Verified
            </div>
          )}
          <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg glass-card text-sm font-bold">
            ${pricePerTonne.toFixed(2)}/t
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          <h3 className="font-semibold text-lg leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
            {description}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary" className="text-xs">
              <MapPin className="w-3 h-3 mr-1" />
              {country}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {category}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              {vintage}
            </Badge>
          </div>

          {/* Payment Section */}
          <div className="mt-auto pt-4 border-t border-border space-y-3">
            {showPayment ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={tonnes}
                    onChange={(e) => setTonnes(Math.max(1, Number(e.target.value)))}
                    className="flex-1 px-2 py-1 text-sm border rounded bg-muted text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="text-xs font-medium text-muted-foreground">tonnes</span>
                </div>
                <div className="text-sm font-bold">
                  ${(pricePerTonne * tonnes).toFixed(2)}
                </div>
                <Button 
                  onClick={handleBuyNow}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  Pay Now
                </Button>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPayment(false);
                  }}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handlePaymentClick}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                size="sm"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Buy Credits
              </Button>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
};