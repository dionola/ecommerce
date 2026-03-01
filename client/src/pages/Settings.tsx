import { useState, useEffect } from 'react';
import { getSettings, saveSettings } from '../services/settings';
import { toast } from '../components/ui/toaster';
import type { UserSettings } from '../services/settings';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function Settings() {
  const [settings, setSettings] = useState<UserSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const data = getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      saveSettings(settings);
      setSaved(true);
      toast({
        title: "Settings saved",
        description: "Your settings have been saved successfully",
        variant: "success",
      })
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: "Error",
        description: 'Failed to save settings',
        variant: "destructive",
      })
    } finally {
      setSaving(false);
    }
  };

  const updateShippingAddress = (field: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      shipping_address: {
        ...prev.shipping_address,
        [field]: value,
      },
    }));
  };

  const updateContactDetails = (field: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      contact_details: {
        ...prev.contact_details,
        [field]: value,
      },
    }));
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <SettingsIcon className="w-8 h-8" />
          <h1 className="text-4xl font-bold">Settings</h1>
        </div>
        <p className="text-muted-foreground">Manage your personal information</p>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <div className="max-w-2xl space-y-8">
          {/* Shipping Address Section */}
          <div className="border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="street">Street Address</Label>
                <Input
                  id="street"
                  value={settings.shipping_address?.street || ''}
                  onChange={(e) => updateShippingAddress('street', e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={settings.shipping_address?.city || ''}
                    onChange={(e) => updateShippingAddress('city', e.target.value)}
                    placeholder="New York"
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={settings.shipping_address?.state || ''}
                    onChange={(e) => updateShippingAddress('state', e.target.value)}
                    placeholder="NY"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="zip">ZIP Code</Label>
                  <Input
                    id="zip"
                    value={settings.shipping_address?.zip || ''}
                    onChange={(e) => updateShippingAddress('zip', e.target.value)}
                    placeholder="10001"
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={settings.shipping_address?.country || ''}
                    onChange={(e) => updateShippingAddress('country', e.target.value)}
                    placeholder="USA"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Details Section */}
          <div className="border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Contact Details</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={settings.contact_details?.phone || ''}
                  onChange={(e) => updateContactDetails('phone', e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="alternate_email">Alternate Email</Label>
                <Input
                  id="alternate_email"
                  type="email"
                  value={settings.contact_details?.alternate_email || ''}
                  onChange={(e) => updateContactDetails('alternate_email', e.target.value)}
                  placeholder="alternate@example.com"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center gap-4">
            <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
            {saved && (
              <span className="text-sm text-green-500">Settings saved successfully!</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

