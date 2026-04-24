import { useEffect, useState } from 'react';
import { createUser, getUsers, updateUserRole } from '../../services/admin';
import type { AdminUser, CreateUserData } from '../../services/admin';
import { Users, Plus, Shield, ShieldCheck } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '../../components/ui/toaster';
import { formatDate } from '../../lib/utils';

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { user } = useAuth();
  const isSuperadmin = user?.groups?.includes('superadmin');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await getUsers();
      setUsers(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to load users',
        variant: "destructive",
      })
    } finally {
      setLoading(false);
    }
  };

  const handlePromote = async (targetUser: AdminUser, role: 'admin' | 'superadmin') => {
    try {
      const updatedUser = await updateUserRole(targetUser.id, role);
      setUsers((prev) => prev.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
      toast({
        title: "Role updated",
        description: `${targetUser.email} is now ${role}`,
        variant: "success",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to update user role',
        variant: "destructive",
      })
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Users</h1>
          <p className="text-muted-foreground">Review users, order activity, and promote existing accounts to admin</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create User
        </Button>
      </div>

      <div className="border border-border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[minmax(0,2fr)_120px_120px_140px_180px] gap-4 px-6 py-4 text-xs uppercase tracking-widest text-muted-foreground border-b border-border bg-secondary/30">
          <div>User</div>
          <div>Role</div>
          <div>Orders</div>
          <div>Items</div>
          <div>Actions</div>
        </div>

        {loading ? (
          <div className="p-8 text-sm text-muted-foreground">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No users found yet.</p>
          </div>
        ) : (
          <div>
            {users.map((listedUser) => (
              <div
                key={listedUser.id}
                className="grid grid-cols-[minmax(0,2fr)_120px_120px_140px_180px] gap-4 px-6 py-4 border-b border-border last:border-b-0 items-center"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">{listedUser.email}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {listedUser.fullName || 'No name'} • Joined {formatDate(listedUser.createdAt)}
                  </p>
                </div>
                <div>
                  <span className="inline-flex items-center gap-2 text-sm capitalize">
                    {listedUser.role === 'superadmin' ? <ShieldCheck className="w-4 h-4 text-amber-500" /> : <Shield className="w-4 h-4 text-muted-foreground" />}
                    {listedUser.role}
                  </span>
                </div>
                <div className="text-sm">{listedUser.orderCount}</div>
                <div className="text-sm">{listedUser.totalItemsOrdered}</div>
                <div className="flex flex-wrap gap-2">
                  {listedUser.role === 'customer' && (
                    <Button size="sm" variant="outline" onClick={() => handlePromote(listedUser, 'admin')}>
                      Make Admin
                    </Button>
                  )}
                  {isSuperadmin && listedUser.role !== 'superadmin' && (
                    <Button size="sm" variant="outline" onClick={() => handlePromote(listedUser, 'superadmin')}>
                      Make Superadmin
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isCreateModalOpen && (
        <CreateUserModal
          onClose={() => setIsCreateModalOpen(false)}
          isSuperadmin={isSuperadmin || false}
          onCreated={loadUsers}
        />
      )}
    </div>
  );
}

function CreateUserModal({
  onClose,
  isSuperadmin,
  onCreated,
}: {
  onClose: () => void;
  isSuperadmin: boolean;
  onCreated: () => Promise<void>;
}) {
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    password: '',
    fullName: '',
    role: 'admin',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createUser(formData);
      toast({
        title: "User created",
        description: "User has been created successfully",
        variant: "success",
      })
      await onCreated()
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Failed to create user',
        variant: "destructive",
      })
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Create User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="fullName">Full Name (optional)</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'superadmin' })}
              className="w-full p-2 border border-border rounded"
              disabled={!isSuperadmin}
            >
              <option value="admin">Admin</option>
              {isSuperadmin && <option value="superadmin">Superadmin</option>}
            </select>
            {!isSuperadmin && (
              <p className="text-xs text-muted-foreground mt-1">
                Admins can only create admin users
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
