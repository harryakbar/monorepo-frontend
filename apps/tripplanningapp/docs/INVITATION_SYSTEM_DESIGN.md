# Group Trip Invitation System Design

## Overview
**DEPRECATED** - See `SIMPLE_INVITATION_DESIGN.md` for the current design.

Simplified invitation system using email links with Google OAuth login.

---

## 🔗 Invitation Flow

### Step 1: Create Group Trip & Invite
```
User creates group trip
    ↓
Clicks "Invite People"
    ↓
Enters email addresses
    ↓
System generates unique invitation links
    ↓
Sends email with invitation link
```

### Step 2: Recipient Receives Email
```
Email contains:
- Trip details (destination, duration)
- Who invited them
- Invitation link
- "Join with Google" button
```

### Step 3: Recipient Clicks Link
```
Opens app at: /invite/{invitation-token}
    ↓
Shows invitation details
    ↓
"Sign in with Google" button
    ↓
Google OAuth flow
    ↓
Auto-joins group trip
```

---

## 📧 Email Template

### Subject
```
You're invited to plan a trip to [Destination]!
```

### Body
```
Hi!

[Your Name] invited you to plan a group trip to [Destination] ([X] days).

Join the planning:
[Button: Join with Google] or [Link: app.com/invite/abc123]

Once you sign in, you'll be able to:
✓ See everyone's availability
✓ Suggest dates
✓ Vote on trip dates
✓ Chat with the group

The invitation link expires in 7 days.

Happy planning!
- Leave Optimizer Team
```

---

## 🔐 Authentication Flow

### Invitation Link Structure
```
https://app.com/invite/{token}
```

### Token Properties
```typescript
interface InvitationToken {
  id: string;
  tripId: string;
  invitedBy: string; // User ID
  invitedEmail: string;
  token: string; // Cryptographically secure random string
  expiresAt: Date; // 7 days from creation
  usedAt: Date | null;
  usedBy: string | null; // User ID who accepted
  createdAt: Date;
}
```

### Flow Diagram
```
┌─────────────────────────────────────────┐
│  User clicks invitation link            │
│  /invite/abc123                         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Check token validity                   │
│  - Exists?                              │
│  - Not expired?                         │
│  - Not used?                            │
└──────────────┬──────────────────────────┘
               │
        ┌──────┴──────┐
        │             │
    Valid          Invalid
        │             │
        ▼             ▼
┌──────────────┐  ┌──────────────┐
│ Show invite  │  │ Show error   │
│ details      │  │ "Link expired│
│              │  │ or invalid"  │
└──────┬───────┘  └──────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  Display:                               │
│  - Trip destination                     │
│  - Trip duration                        │
│  - Who invited you                      │
│  - Current members                      │
│  - "Sign in with Google" button         │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  User clicks "Sign in with Google"      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Google OAuth Flow                      │
│  - Redirect to Google                  │
│  - User authorizes                      │
│  - Redirect back with code              │
│  - Exchange code for tokens             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Create/Get User Account                │
│  - If new: Create account with Google   │
│  - If existing: Link Google account    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Auto-join Group Trip                   │
│  - Add user to trip.members             │
│  - Mark invitation as used             │
│  - Redirect to group trip view          │
└─────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### Invitations Table
```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY,
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES users(id),
  invited_email VARCHAR(255) NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  used_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_trip ON invitations(trip_id);
```

### Updated Trips Table
```sql
-- Add invitation settings
ALTER TABLE trips ADD COLUMN allow_invitations BOOLEAN DEFAULT true;
ALTER TABLE trips ADD COLUMN invitation_expiry_days INTEGER DEFAULT 7;
```

---

## 🎨 UI Components

### Invitation Page (`/invite/:token`)

```
┌─────────────────────────────────────────┐
│  🎉 You're Invited!                     │
├─────────────────────────────────────────┤
│                                         │
│  [Trip Image/Icon]                      │
│                                         │
│  [Your Name] invited you to plan:       │
│                                         │
│  ✈️  Bangkok, Thailand                  │
│  📅  5 days                             │
│                                         │
│  Current members:                       │
│  👤 You (Owner)                         │
│  👤 Jane                                │
│  👤 Bob                                 │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  [G] Sign in with Google         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  By signing in, you'll be able to:      │
│  ✓ See everyone's availability         │
│  ✓ Suggest and vote on dates           │
│  ✓ Chat with the group                 │
│                                         │
│  Link expires in 5 days                 │
└─────────────────────────────────────────┘
```

### Invitation Dialog (When Creating Group Trip)

```
┌─────────────────────────────────────────┐
│  Invite People to Group Trip            │
├─────────────────────────────────────────┤
│                                         │
│  Enter email addresses:                 │
│  ┌─────────────────────────────────┐   │
│  │ friend@example.com        [Add] │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Invited:                               │
│  📧 friend@example.com                  │
│     [Invitation sent ✓]                 │
│                                         │
│  📧 colleague@example.com               │
│     [Invitation sent ✓]                 │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  [Copy Invitation Link]          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Cancel]  [Done]                       │
└─────────────────────────────────────────┘
```

---

## 🔧 Implementation Details

### 1. Generate Invitation Token
```typescript
function generateInvitationToken(): string {
  // Cryptographically secure random string
  return crypto.randomBytes(32).toString('base64url');
}

async function createInvitation(
  tripId: string,
  invitedBy: string,
  email: string
): Promise<InvitationToken> {
  const token = generateInvitationToken();
  const expiresAt = addDays(new Date(), 7);
  
  const invitation = await db.invitations.create({
    tripId,
    invitedBy,
    invitedEmail: email,
    token,
    expiresAt,
  });
  
  // Send email
  await sendInvitationEmail(email, {
    tripName: trip.destination,
    inviterName: inviter.displayName,
    invitationLink: `${APP_URL}/invite/${token}`,
  });
  
  return invitation;
}
```

### 2. Validate Invitation
```typescript
async function validateInvitation(
  token: string
): Promise<{ valid: boolean; invitation?: InvitationToken; error?: string }> {
  const invitation = await db.invitations.findOne({ token });
  
  if (!invitation) {
    return { valid: false, error: 'Invitation not found' };
  }
  
  if (invitation.usedAt) {
    return { valid: false, error: 'Invitation already used' };
  }
  
  if (invitation.expiresAt < new Date()) {
    return { valid: false, error: 'Invitation expired' };
  }
  
  return { valid: true, invitation };
}
```

### 3. Accept Invitation (After Google Login)
```typescript
async function acceptInvitation(
  token: string,
  userId: string
): Promise<void> {
  const invitation = await validateInvitation(token);
  
  if (!invitation.valid || !invitation.invitation) {
    throw new Error(invitation.error || 'Invalid invitation');
  }
  
  // Add user to trip
  await db.trips.update({
    where: { id: invitation.invitation.tripId },
    data: {
      members: {
        push: {
          userId,
          role: 'member',
          joinedAt: new Date(),
        },
      },
    },
  });
  
  // Mark invitation as used
  await db.invitations.update({
    where: { id: invitation.invitation.id },
    data: {
      usedAt: new Date(),
      usedBy: userId,
    },
  });
}
```

### 4. Google OAuth Integration
```typescript
// Using Supabase Auth
const handleGoogleSignIn = async (invitationToken?: string) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: invitationToken
        ? `${window.location.origin}/invite/${invitationToken}?accepted=true`
        : `${window.location.origin}/`,
    },
  });
  
  if (error) throw error;
};

// After OAuth callback
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const invitationToken = urlParams.get('token');
  const accepted = urlParams.get('accepted');
  
  if (accepted === 'true' && invitationToken) {
    // User just signed in, auto-accept invitation
    acceptInvitation(invitationToken, currentUser.id);
  }
}, []);
```

---

## 📱 Frontend Components

### InvitationPage Component
```typescript
// src/app/invite/[token]/page.tsx
export function InvitationPage({ token }: { token: string }) {
  const [invitation, setInvitation] = useState<InvitationToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    fetchInvitation(token).then((result) => {
      if (result.valid && result.invitation) {
        setInvitation(result.invitation);
      } else {
        setError(result.error || 'Invalid invitation');
      }
      setLoading(false);
    });
  }, [token]);
  
  const handleGoogleSignIn = () => {
    // Redirect to Google OAuth with invitation token in state
    window.location.href = `/auth/google?invitation=${token}`;
  };
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay message={error} />;
  if (!invitation) return null;
  
  return (
    <div className="invitation-page">
      <InvitationDetails invitation={invitation} />
      <GoogleSignInButton onClick={handleGoogleSignIn} />
    </div>
  );
}
```

### InviteDialog Component
```typescript
// src/app/components/InviteDialog.tsx
export function InviteDialog({
  tripId,
  open,
  onClose,
}: {
  tripId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState('');
  const [sentInvitations, setSentInvitations] = useState<Invitation[]>([]);
  
  const handleSendInvitation = async () => {
    if (!email.trim()) return;
    
    const invitation = await createInvitation(tripId, currentUser.id, email);
    setSentInvitations([...sentInvitations, invitation]);
    setEmail('');
  };
  
  const handleCopyLink = async () => {
    const link = `${APP_URL}/invite/${invitation.token}`;
    await navigator.clipboard.writeText(link);
    toast.success('Link copied!');
  };
  
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <DialogTitle>Invite People</DialogTitle>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button onClick={handleSendInvitation}>
              Send Invitation
            </Button>
          </div>
          
          {sentInvitations.length > 0 && (
            <div className="space-y-2">
              <Label>Sent Invitations:</Label>
              {sentInvitations.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between">
                  <span>{inv.invitedEmail}</span>
                  <Badge variant={inv.usedAt ? 'success' : 'pending'}>
                    {inv.usedAt ? 'Accepted' : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          
          <Separator />
          
          <div>
            <Label>Or share link directly:</Label>
            <div className="flex gap-2 mt-2">
              <Input value={invitationLink} readOnly />
              <Button onClick={handleCopyLink}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 🔒 Security Considerations

### Token Security
- **Cryptographically secure**: Use `crypto.randomBytes()` or similar
- **One-time use**: Mark as used after acceptance
- **Expiration**: 7 days default, configurable
- **Rate limiting**: Prevent spam invitations

### Email Validation
- **Basic validation**: Check email format
- **Domain validation**: Optional - block certain domains
- **Unsubscribe**: Allow users to opt-out

### OAuth Security
- **State parameter**: Include invitation token in OAuth state
- **CSRF protection**: Verify state on callback
- **Token binding**: Link invitation to specific email (optional)

---

## 📊 User Experience Flow

### For Inviter
1. Create group trip
2. Click "Invite People"
3. Enter email addresses
4. System sends invitations automatically
5. See invitation status (pending/accepted)

### For Invitee
1. Receives email with invitation
2. Clicks link → Opens invitation page
3. Sees trip details
4. Clicks "Sign in with Google"
5. Google OAuth flow
6. Auto-joins trip
7. Redirected to group trip view

---

## 🎯 Benefits of This Approach

1. **Simple**: Just email + Google login
2. **Secure**: OAuth is industry standard
3. **No passwords**: Users don't need to create accounts
4. **Fast**: One-click sign-in
5. **Familiar**: Everyone knows Google login
6. **Flexible**: Can add other OAuth providers later

---

## 🔄 Alternative: Magic Link (Passwordless)

If you want to avoid OAuth entirely:

```
Email contains magic link
    ↓
User clicks link
    ↓
Auto-signs in (no password needed)
    ↓
Joins trip
```

**Pros**: Even simpler, no OAuth setup
**Cons**: Less familiar, requires email verification

---

## 📝 Summary

**Invitation Flow:**
1. Email invitation link
2. Click link → See invitation page
3. Sign in with Google
4. Auto-join group trip

**Key Features:**
- Unique invitation tokens
- 7-day expiration
- One-time use
- Google OAuth integration
- Automatic trip joining

This approach is simple, secure, and user-friendly!

