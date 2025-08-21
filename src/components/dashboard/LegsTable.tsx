import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Leg {
  id: string;
  user_id: string;
  game_desc: string;
  market_key: string;
  selection: string;
  line: number | null;
  american_odds: number;
  decimal_odds: number;
  source: string;
  status: 'PENDING' | 'OK' | 'DUPLICATE' | 'CONFLICT' | 'REJECTED';
  profiles?: {
    name: string;
  };
}

interface LegsTableProps {
  legs: Leg[];
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'OK':
      return 'default';
    case 'PENDING':
      return 'secondary';
    case 'DUPLICATE':
      return 'destructive';
    case 'CONFLICT':
      return 'destructive';
    case 'REJECTED':
      return 'destructive';
    default:
      return 'secondary';
  }
};

export const LegsTable = ({ legs }: LegsTableProps) => {
  if (legs.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No legs submitted yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Game</TableHead>
            <TableHead>Market</TableHead>
            <TableHead>Selection</TableHead>
            <TableHead>Line</TableHead>
            <TableHead>Odds</TableHead>
            <TableHead>Decimal</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {legs.map((leg) => (
            <TableRow key={leg.id}>
              <TableCell className="font-medium">{leg.profiles?.name || 'Unknown User'}</TableCell>
              <TableCell className="max-w-[200px] truncate">{leg.game_desc}</TableCell>
              <TableCell>{leg.market_key}</TableCell>
              <TableCell className="max-w-[150px] truncate">{leg.selection}</TableCell>
              <TableCell>{leg.line || '-'}</TableCell>
              <TableCell>
                {leg.american_odds > 0 ? '+' : ''}{leg.american_odds}
              </TableCell>
              <TableCell>{leg.decimal_odds.toFixed(2)}</TableCell>
              <TableCell>
                <Badge variant={leg.source === 'api' ? 'default' : 'secondary'}>
                  {leg.source === 'api' ? 'DraftKings' : 'Manual'}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={getStatusColor(leg.status)}>
                  {leg.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};