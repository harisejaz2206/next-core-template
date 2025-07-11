import LoginForm from '@/components/LoginForm';
import ProfileTestButton from '@/components/ProfileTestButton';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Next.js Template</h1>
          <p className="text-gray-600">Test the authentication system</p>
        </div>
        <LoginForm />
        <ProfileTestButton />
      </div>
    </div>
  );
}
