import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  Building, 
  UserCheck, 
  CreditCard, 
  Wallet, 
  Tags, 
  Briefcase,
  LogOut,
  LogIn,
  BarChart3,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import LoginForm from './components/auth/LoginForm';
import Modal from './components/ui/Modal';
import Button from './components/ui/Button';
import ToastContainer from './components/ui/ToastContainer';
import { useToast } from './hooks/useToast';
import UsuariosCRUD from './components/crud/UsuariosCRUD';
import GruposEmpresasCRUD from './components/crud/GruposEmpresasCRUD';
import EmpresasCRUD from './components/crud/EmpresasCRUD';
import ContasPagarCRUD from './components/crud/ContasPagarCRUD';
import ContasReceberCRUD from './components/crud/ContasReceberCRUD';
import ParticipantesCRUD from './components/crud/ParticipantesCRUD';
import CategoriasCRUD from './components/crud/CategoriasCRUD';
import DepartamentosCRUD from './components/crud/DepartamentosCRUD';
import FormasCobrancaCRUD from './components/crud/FormasCobrancaCRUD';
import { getCurrentUser, signOut } from './lib/supabase';

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const { toasts, removeToast, showError, showSuccess } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Erro ao verificar usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setActiveTab('dashboard');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleLoginSuccess = () => {
    checkUser();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'usuarios', name: 'Usuários', icon: Users },
    { id: 'grupos', name: 'Grupos', icon: Building2 },
    { id: 'empresas', name: 'Empresas', icon: Building },
    { id: 'participantes', name: 'Participantes', icon: UserCheck },
    { id: 'categorias', name: 'Categorias', icon: Tags },
    { id: 'departamentos', name: 'Departamentos', icon: Briefcase },
    { id: 'formas', name: 'Formas Cobrança', icon: CreditCard },
    { id: 'contas-pagar', name: 'Contas a Pagar', icon: TrendingDown },
    { id: 'contas-receber', name: 'Contas a Receber', icon: TrendingUp }
  ];

  const renderContent = () => {
    if (!user) {
      return (
        <div className="max-w-md mx-auto mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Sistema de Gestão Financeira
            </h2>
            <LoginForm onLoginSuccess={handleLoginSuccess} />
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Sistema de Gestão Financeira
              </h2>
              <p className="text-gray-600 mb-4">
                Bem-vindo ao sistema completo de gestão de contas a pagar e receber.
                Use o menu lateral para navegar entre as diferentes seções.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {tabs.slice(1).map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <Icon className="h-6 w-6 text-blue-600 mb-2" />
                      <h3 className="font-medium text-gray-900">{tab.name}</h3>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      case 'usuarios':
        return <UsuariosCRUD showError={showError} showSuccess={showSuccess} />;
      case 'grupos':
        return <GruposEmpresasCRUD showError={showError} showSuccess={showSuccess} />;
      case 'empresas':
        return <EmpresasCRUD showError={showError} showSuccess={showSuccess} />;
      case 'participantes':
        return <ParticipantesCRUD showError={showError} showSuccess={showSuccess} />;
      case 'categorias':
        return <CategoriasCRUD showError={showError} showSuccess={showSuccess} />;
      case 'departamentos':
        return <DepartamentosCRUD showError={showError} showSuccess={showSuccess} />;
      case 'formas':
        return <FormasCobrancaCRUD showError={showError} showSuccess={showSuccess} />;
      case 'contas-pagar':
        return <ContasPagarCRUD showError={showError} showSuccess={showSuccess} />;
      case 'contas-receber':
        return <ContasReceberCRUD showError={showError} showSuccess={showSuccess} />;
      default:
        return <div>Selecione uma opção do menu</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-900">Sistema Financeiro</h1>
          <p className="text-sm text-gray-600">{user ? user.email : 'Convidado'}</p>
        </div>
        
        <nav className="p-4 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-left rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-5 w-5 mr-3" />
                {tab.name}
              </button>
            );
          })}
        
        {user && (
          <button
            onClick={handleSignOut}
            className="w-full flex items-center px-3 py-2 text-left rounded-md transition-colors text-gray-700 hover:bg-gray-100"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sair
          </button>
        )}
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6">
        {renderContent()}
      </div>
      
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
}

export default App;