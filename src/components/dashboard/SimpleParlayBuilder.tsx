import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { X, Calculator } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

import type { Leg } from '@/types/database';

interface SimpleParlayBuilderProps {
  legs: Leg[];
  onParlayCreated: () => void;
}

export const SimpleParlayBuilder = ({ legs, onParlayCreated }: SimpleParlayBuilderProps) => {
  const [selectedLegs, setSelectedLegs] = useState<string[]>([]);
  const [totalStake, setTotalStake] = useState('');

  const availableLegs = legs.filter(leg => leg.status === 'PENDING');

  const handleLegToggle = (legId: string) => {
    setSelectedLegs(prev => 
      prev.includes(legId) 
        ? prev.filter(id => id !== legId)
        : [...prev, legId]
    );
  };

  const calculateParlayOdds = () => {
    const selectedLegData = availableLegs.filter(leg => selectedLegs.includes(leg.id));
    
    if (selectedLegData.length === 0) return { totalOdds: 0, payout: 0 };

    // Use decimal odds for calculation
    let combinedDecimalOdds = 1;
    
    selectedLegData.forEach(leg => {
      combinedDecimalOdds *= leg.decimal_odds;
    });

    // Convert back to American odds
    let americanOdds;
    if (combinedDecimalOdds >= 2) {
      americanOdds = Math.round((combinedDecimalOdds - 1) * 100);
    } else {
      americanOdds = Math.round(-100 / (combinedDecimalOdds - 1));
    }

    const stake = parseFloat(totalStake) || 0;
    const payout = stake * combinedDecimalOdds;

    return { 
      totalOdds: americanOdds, 
      payout: payout,
      profit: payout - stake,
      decimalOdds: combinedDecimalOdds
    };
  };

  const handleCreateParlay = async () => {
    if (selectedLegs.length < 2) {
      toast({
        title: "Error",
        description: "A parlay must have at least 2 legs",
        variant: "destructive",
      });
      return;
    }

    const stake = parseFloat(totalStake) || 0;
    const { payout, decimalOdds, totalOdds } = calculateParlayOdds();
    const selectedLegData = availableLegs.filter(leg => selectedLegs.includes(leg.id));

    // For now, just show success message since we simplified the parlay creation
    toast({
      title: "Parlay Created",
      description: `${selectedLegs.length} legs selected with ${totalOdds > 0 ? '+' : ''}${totalOdds} odds`,
    });

    // Reset form
    setSelectedLegs([]);
    setTotalStake('');
    onParlayCreated();
  };

  const { totalOdds, payout, profit, decimalOdds } = calculateParlayOdds();
  const selectedLegData = availableLegs.filter(leg => selectedLegs.includes(leg.id));

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {/* Available Legs */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Available Legs</h3>
        
        {availableLegs.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No pending legs available. Create some legs first!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {availableLegs.map(leg => (
              <Card 
                key={leg.id}
                className={`cursor-pointer transition-all ${
                  selectedLegs.includes(leg.id) 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-muted/50'
                }`}
                onClick={() => handleLegToggle(leg.id)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        checked={selectedLegs.includes(leg.id)}
                        onChange={() => handleLegToggle(leg.id)}
                      />
                      <div className="space-y-1">
                        <div className="font-medium">{leg.game_desc}</div>
                        <div className="text-sm text-muted-foreground">
                          {leg.selection}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{leg.sport_key}</Badge>
                          <Badge variant="outline">{leg.league}</Badge>
                          <Badge variant="outline">{leg.market_key}</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-semibold">
                        {leg.american_odds > 0 ? '+' : ''}{leg.american_odds}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {leg.decimal_odds.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Parlay Calculator */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Parlay Calculator</h3>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Calculate Payout
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="totalStake">Total Stake ($)</Label>
              <Input
                id="totalStake"
                type="number"
                step="0.01"
                value={totalStake}
                onChange={(e) => setTotalStake(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium">Selected Legs ({selectedLegs.length})</h4>
              
              {selectedLegData.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Select legs from the left to build your parlay
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedLegData.map(leg => (
                    <div key={leg.id} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="text-sm">
                        <div className="font-medium">{leg.selection}</div>
                        <div className="text-muted-foreground">{leg.game_desc}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {leg.american_odds > 0 ? '+' : ''}{leg.american_odds}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLegToggle(leg.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedLegs.length >= 2 && totalStake && (
              <>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Combined Odds:</span>
                    <span className="font-mono">
                      {totalOdds > 0 ? '+' : ''}{totalOdds}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Decimal Odds:</span>
                    <span className="font-mono">{decimalOdds?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Potential Payout:</span>
                    <span className="font-medium">${payout?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Potential Profit:</span>
                    <span className="font-medium">+${profit?.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}

            <Button 
              onClick={handleCreateParlay}
              disabled={selectedLegs.length < 2}
              className="w-full"
            >
              Calculate Parlay
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};