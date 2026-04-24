import { Mail } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useState } from 'react';
import { toast } from '../components/ui/toaster';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Message sent",
      description: "This demo form is wired up for UI testing and doesn't send a live support request.",
      variant: "success",
    });
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Mail className="w-8 h-8" />
          <h1 className="text-4xl font-bold">Contact</h1>
        </div>
        <p className="text-muted-foreground">Demo contact details for Stephen&apos;s test storefront</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Send a test message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="rounded-none border-border h-12"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="rounded-none border-border h-12"
              />
            </div>
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
                className="rounded-none border-border h-12"
              />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={6}
                className="w-full p-3 border border-border rounded-none resize-none"
              />
            </div>
            <Button type="submit" className="rounded-none h-12">
              Send Message
            </Button>
          </form>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Demo Information</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Email</p>
              <p className="font-medium">stephen+demo@dionola.com</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Project</p>
              <p className="font-medium">dionola storefront sandbox</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Dataset</p>
              <p className="font-medium">H&amp;M dataset sample by Luminati</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}






