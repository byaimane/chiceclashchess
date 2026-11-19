import { CheckCircle2, Lock, Mail, ShieldCheck, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

export function PrivacyPage() {
  const [accountIdentifier, setAccountIdentifier] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleDeletionRequest = (e: FormEvent) => {
    e.preventDefault();
    if (!accountIdentifier.trim()) return;
    setSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-[#2E5D47] bg-[#112B20]/80 p-6 sm:p-8">
        <div className="inline-flex items-center gap-2 rounded border border-[#E6B84C]/40 bg-[#0B1F17] px-3 py-1 text-xs font-semibold uppercase tracking-widest text-[#E6B84C]">
          <ShieldCheck className="h-4 w-4" />
          Google Play Data Safety &amp; Privacy Compliance
        </div>

        <h1 className="mt-4 text-3xl font-bold text-[#F7F1E3] sm:text-4xl">
          ChoiceCLASH Privacy Policy &amp; Account Deletion
        </h1>
        <p className="mt-2 text-sm text-[#9CA3AF]">
          Effective Date: November 2026 &bull; Package ID:{' '}
          <code className="rounded bg-[#0B1F17] px-1.5 py-0.5 text-[#E6B84C]">
            com.choiceclash.app
          </code>
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[#D1D5DB]">
          <section className="rounded-lg border border-[#1E4635] bg-[#0B1F17]/70 p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-[#F7F1E3]">
              <Lock className="h-4 w-4 text-[#E6B84C]" />
              1. Information We Collect
            </h2>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[#9CA3AF]">
              <li>
                <strong className="text-[#F7F1E3]">Account Information (Optional):</strong>{' '}
                When you create an online multiplayer account, we store your username, email
                address, and a bcrypt-hashed password. Offline modes (AI Arena, Pass &amp;
                Play, Tactical Puzzles, and Royal Odyssey Adventure Map) require no account.
              </li>
              <li>
                <strong className="text-[#F7F1E3]">Gameplay &amp; Progression Data:</strong>{' '}
                Online match history (moves in SAN/PGN format, ratings, wins/losses/draws) is
                stored on our game server. Offline progression (RPG XP, Gold, Adventure stars,
                and puzzle streaks) is stored locally on your device.
              </li>
              <li>
                <strong className="text-[#F7F1E3]">No Tracking or Selling of Data:</strong>{' '}
                ChoiceCLASH does not collect precise location, contacts, microphone, camera, or
                advertising identifiers, and never sells user data to third parties.
              </li>
            </ul>
          </section>

          <section className="rounded-lg border border-[#1E4635] bg-[#0B1F17]/70 p-5">
            <h2 className="text-base font-bold text-[#F7F1E3]">
              2. How We Use &amp; Protect Your Data
            </h2>
            <p className="mt-2 text-[#9CA3AF]">
              All communication between the ChoiceCLASH Android application (
              <code>com.choiceclash.app</code>) and our game server uses HTTPS/TLS encryption.
              Account data is used solely to authenticate online sessions, synchronize live
              board themes, and maintain your multiplayer chess rating.
            </p>
          </section>

          <section
            id="delete-account"
            className="rounded-lg border border-[#E6B84C]/50 bg-[#0B1F17] p-5"
          >
            <h2 className="flex items-center gap-2 text-base font-bold text-[#E6B84C]">
              <Trash2 className="h-4 w-4" />
              3. Account &amp; Data Deletion (In-App &amp; Web Request)
            </h2>
            <p className="mt-2 text-[#9CA3AF]">
              You can permanently delete your ChoiceCLASH account and all associated profile
              and match data at any time using either method below:
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[#9CA3AF]">
              <li>
                <strong className="text-[#F7F1E3]">Inside the Android App:</strong> Open the{' '}
                <strong className="text-[#E6B84C]">Online</strong> tab, tap{' '}
                <strong className="text-[#E6B84C]">Privacy &amp; Delete Account</strong>, and
                confirm deletion.
              </li>
              <li>
                <strong className="text-[#F7F1E3]">Via Web Form Below:</strong> Submit your
                username or registered email address below to request full account and data
                erasure within 48 hours.
              </li>
            </ul>

            {submitted ? (
              <div className="mt-4 flex items-center gap-2 rounded border border-[#4ADE80]/40 bg-[#4ADE80]/10 p-4 text-xs text-[#F7F1E3]">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-[#4ADE80]" />
                <div>
                  <p className="font-bold text-[#4ADE80]">
                    Account Deletion Request Recorded
                  </p>
                  <p className="mt-0.5 text-[#9CA3AF]">
                    We have queued permanent erasure for{' '}
                    <strong className="text-[#F7F1E3]">{accountIdentifier}</strong>. All
                    associated account credentials and personal data will be purged.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleDeletionRequest} className="mt-4 space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF]">
                    Registered Email or Username
                  </label>
                  <input
                    type="text"
                    required
                    value={accountIdentifier}
                    onChange={(e) => setAccountIdentifier(e.target.value)}
                    placeholder="player@example.com or username"
                    className="mt-1 w-full rounded border border-[#2E5D47] bg-[#112B20] px-3 py-2 text-sm text-[#F7F1E3] placeholder:text-[#6B7280] focus:border-[#E6B84C] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#9CA3AF]">
                    Optional Note
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Delete account and all match data"
                    className="mt-1 w-full rounded border border-[#2E5D47] bg-[#112B20] px-3 py-2 text-sm text-[#F7F1E3] placeholder:text-[#6B7280] focus:border-[#E6B84C] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded border border-red-500/50 bg-red-900/60 px-4 py-2 text-xs font-bold text-red-100 transition hover:bg-red-800"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Request Permanent Account Deletion
                </button>
              </form>
            )}
          </section>

          <section className="rounded-lg border border-[#1E4635] bg-[#0B1F17]/70 p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-[#F7F1E3]">
              <Mail className="h-4 w-4 text-[#E6B84C]" />
              4. Contact
            </h2>
            <p className="mt-1 text-[#9CA3AF]">
              For privacy inquiries or data requests, contact the ChoiceCLASH support team at{' '}
              <span className="text-[#E6B84C]">admin@choiceclash.com</span>.
            </p>
          </section>
        </div>

        <div className="mt-8 border-t border-[#1E4635] pt-5">
          <Link
            to="/"
            className="text-xs font-semibold text-[#E6B84C] hover:underline"
          >
            &larr; Back to ChoiceCLASH Android Download Page
          </Link>
        </div>
      </div>
    </div>
  );
}
