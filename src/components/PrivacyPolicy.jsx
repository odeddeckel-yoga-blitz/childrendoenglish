import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy({ onBack }) {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2.5 rounded-xl hover:bg-slate-100 transition-colors" aria-label="Back to menu">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-xl font-bold text-slate-800">Privacy Policy</h2>
      </div>

      <div className="glass rounded-2xl p-5 space-y-4 text-sm text-slate-600 leading-relaxed">
        <p className="text-xs text-slate-400">Last updated: February 28, 2026</p>

        <section className="space-y-2">
          <h3 className="font-bold text-slate-800">What data we collect</h3>
          <p>Children Do English does <strong>not</strong> collect any personal information. We do not ask for names, email addresses, or any other identifying details.</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-slate-800">What is stored on your device</h3>
          <p>Your learning progress (quiz scores, word progress, streak, badges, and preferences like dark mode and sound) is saved in your browser's local storage. This data never leaves your device and is not sent to any server.</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-slate-800">Cookies & tracking</h3>
          <p>We do not use cookies. We do not use any advertising or tracking services. We use <strong>Plausible Analytics</strong>, a privacy-focused analytics tool that does not use cookies, does not collect personal data, and is fully GDPR/CCPA compliant. It only counts page views and basic device information (browser, country) with no way to identify individual users.</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-slate-800">Third-party services</h3>
          <p>The app uses Plausible Analytics (plausible.io) for anonymous usage statistics. The browser's built-in speech synthesis may connect to your device's speech engine for word pronunciation. All word data and images are bundled with the app.</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-slate-800">Children's privacy</h3>
          <p>This app is designed for children ages 6-12. Because we do not collect or transmit any personal data, there is no risk of children's information being shared or misused.</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-slate-800">Deleting your data</h3>
          <p>You can clear all saved progress by clearing your browser's site data for this website, or by using your browser's "Clear browsing data" feature.</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-bold text-slate-800">Contact</h3>
          <p>Children Do English is made by Oded Deckelbaum. If you have questions about this privacy policy or the app, email <a href="mailto:odeddeckel@gmail.com" className="text-blue-600 underline">odeddeckel@gmail.com</a>.</p>
        </section>
      </div>
    </div>
  );
}
