import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Search, UserPlus, Settings, Crown, Shield } from 'lucide-react';

interface User {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'MEMBER' | 'COMMISSIONER';
  team_name: string | null;
  created_at: string;
  updated_at: string;
}

interface UserStats {
  user_id: string;
  total_legs: number;
  approved_legs: number;
  pending_legs: number;
  rejected_legs: number;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [userStats, setUserStats] = useState<Record<string, UserStats>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      setUsers(usersData || []);

      // Fetch user statistics
      if (usersData && usersData.length > 0) {
        const userIds = usersData.map(user => user.user_id);
        
        const { data: legsData } = await supabase
          .from('legs')
          .select('user_id, status')
          .in('user_id', userIds);

        // Calculate stats for each user
        const statsMap: Record<string, UserStats> = {};
        
        usersData.forEach(user => {
          const userLegs = legsData?.filter(leg => leg.user_id === user.user_id) || [];
          statsMap[user.user_id] = {
            user_id: user.user_id,
            total_legs: userLegs.length,
            approved_legs: userLegs.filter(leg => leg.status === 'OK').length,
            pending_legs: userLegs.filter(leg => leg.status === 'PENDING').length,
            rejected_legs: userLegs.filter(leg => leg.status === 'REJECTED').length
          };
        });

        setUserStats(statsMap);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'MEMBER' | 'COMMISSIONER') => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      });
      
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const updateUserInfo = async (userId: string, name: string, teamName: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          name,
          team_name: teamName || null
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User information updated",
      });
      
      fetchUsers();
      setEditModalOpen(false);
    } catch (error) {
      console.error('Error updating user info:', error);
      toast({
        title: "Error",
        description: "Failed to update user information",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.team_name?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  const UserEditModal = () => {
    const [editName, setEditName] = useState(selectedUser?.name || '');
    const [editTeamName, setEditTeamName] = useState(selectedUser?.team_name || '');

    return (
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Information</DialogTitle>
            <DialogDescription>
              Update user profile information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter full name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="team">Team Name</Label>
              <Input
                id="team"
                value={editTeamName}
                onChange={(e) => setEditTeamName(e.target.value)}
                placeholder="Enter team name (optional)"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => selectedUser && updateUserInfo(selectedUser.user_id, editName, editTeamName)}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage user accounts and permissions</p>
        </div>
        <Badge variant="secondary">{users.length} users</Badge>
      </div>

      {/* Search and Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Search Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Search by name, email, or team..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button variant="outline">
              <UserPlus className="h-4 w-4 mr-2" />
              Invite User
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Showing {filteredUsers.length} of {users.length} users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Stats</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const stats = userStats[user.user_id];
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'COMMISSIONER' ? 'default' : 'secondary'}>
                          {user.role === 'COMMISSIONER' && <Crown className="h-3 w-3 mr-1" />}
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.team_name ? (
                          <Badge variant="outline">{user.team_name}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">No team</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {stats && (
                          <div className="text-sm space-y-1">
                            <div>Total: {stats.total_legs}</div>
                            <div className="flex space-x-2">
                              <Badge variant="default" className="text-xs">
                                ✓ {stats.approved_legs}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                ⏳ {stats.pending_legs}
                              </Badge>
                              <Badge variant="destructive" className="text-xs">
                                ✗ {stats.rejected_legs}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedUser(user);
                              setEditModalOpen(true);
                            }}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          
                          <Select
                            value={user.role}
                            onValueChange={(value: 'MEMBER' | 'COMMISSIONER') => 
                              updateUserRole(user.user_id, value)
                            }
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MEMBER">
                                <div className="flex items-center">
                                  <Shield className="h-3 w-3 mr-2" />
                                  Member
                                </div>
                              </SelectItem>
                              <SelectItem value="COMMISSIONER">
                                <div className="flex items-center">
                                  <Crown className="h-3 w-3 mr-2" />
                                  Commissioner
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <UserEditModal />
    </div>
  );
};