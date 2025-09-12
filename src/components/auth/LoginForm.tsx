import React, { useState } from 'react';
import { signIn, signUp } from '../../lib/supabase';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface LoginFormProps {
  onLoginSuccess: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('demo@financial.com');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) throw error;
      } else {
        const { error } = await signUp(email, password);
        if (error) throw error;
      }
      onLoginSuccess();
    } catch (error: any) {
      let errorMessage = 'Erro na autenticação';
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Email ou senha incorretos. Verifique suas credenciais ou crie uma nova conta.';
      } else if (error.message?.includes('over_email_send_rate_limit')) {
        const match = error.message.match(/after (\d+) seconds/);
        const seconds = match ? match[1] : '60';
        errorMessage = `Muitas tentativas de cadastro. Aguarde ${seconds} segundos antes de tentar novamente.`;
      } else if (error.message?.includes('Please connect to Supabase first')) {
        errorMessage = 'Por favor, conecte ao Supabase primeiro clicando no botão "Connect to Supabase" no topo da página.';
      } else {
        errorMessage = error.message || 'Erro na autenticação';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-gray-600">
          {isLogin ? 'Faça login em sua conta' : 'Crie uma nova conta'}
        </p>
      </div>
      
      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="seu@email.com"
        />
        
        <Input
          label="Senha"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Sua senha"
        />

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        <div className="space-y-4">
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Aguarde...' : isLogin ? 'Entrar' : 'Cadastrar'}
          </Button>
          
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-500"
          >
            {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
          </button>
        </div>
      </form>
      
      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800 font-medium">⚠️ Importante:</p>
        <p className="text-sm text-blue-600">Para usar a conta demo (demo@financial.com), você precisa criá-la primeiro no painel do Supabase ou cadastrar uma nova conta.</p>
        <p className="text-sm text-blue-600 mt-2">Se você receber erro de credenciais inválidas, tente cadastrar uma nova conta primeiro.</p>
      </div>
    </div>
  );
};

export default LoginForm;