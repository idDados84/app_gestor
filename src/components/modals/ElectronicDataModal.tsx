import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { ElectronicData } from '../../types/database';

interface ElectronicDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ElectronicData, authorizationId: string) => void;
  initialData?: ElectronicData | null;
}

const ElectronicDataModal: React.FC<ElectronicDataModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  const [tipoIntegracao, setTipoIntegracao] = useState('');
  const [credenciadora, setCredenciadora] = useState('');
  const [bandeira, setBandeira] = useState('');
  const [numeroAutorizacao, setNumeroAutorizacao] = useState('');
  const [numeroNsu, setNumeroNsu] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && initialData) {
      setTipoIntegracao(initialData.tipoIntegracao || '');
      setCredenciadora(initialData.credenciadora || '');
      setBandeira(initialData.bandeira || '');
      setNumeroAutorizacao(initialData.numeroAutorizacao || '');
      setNumeroNsu(initialData.numeroNsu || '');
    } else if (isOpen) {
      // Reset form when opening for new entry
      setTipoIntegracao('');
      setCredenciadora('');
      setBandeira('');
      setNumeroAutorizacao('');
      setNumeroNsu('');
    }
    setErrors({}); // Clear errors on modal open/close
  }, [isOpen, initialData]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!tipoIntegracao) newErrors.tipoIntegracao = 'Tipo de Integração é obrigatório.';
    if (!credenciadora) newErrors.credenciadora = 'Credenciadora é obrigatória.';
    if (!bandeira) newErrors.bandeira = 'Bandeira é obrigatória.';
    if (!numeroAutorizacao) newErrors.numeroAutorizacao = 'Nº Autorização é obrigatório.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      return;
    }

    const electronicData: ElectronicData = {
      tipoIntegracao,
      credenciadora,
      bandeira,
      numeroAutorizacao,
      numeroNsu: numeroNsu || undefined,
    };
    onSubmit(electronicData, numeroAutorizacao);
    onClose();
  };

  const tipoIntegracaoOptions = [
    { value: 'PIX', label: 'PIX' },
    { value: 'CARTAO_DEBITO', label: 'Cartão de Débito' },
    { value: 'CARTAO_CREDITO', label: 'Cartão de Crédito' },
    { value: 'CHEQUE', label: 'Cheque' },
    { value: 'TED', label: 'TED' },
    { value: 'DOC', label: 'DOC' },
    { value: 'BOLETO', label: 'Boleto' },
    { value: 'OUTROS', label: 'Outros' },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Dados de Pagamento Eletrônico">
      <form onSubmit={handleSubmit}>
        <Select
          label="Tipo de Integração"
          value={tipoIntegracao}
          onChange={(e) => setTipoIntegracao(e.target.value)}
          options={tipoIntegracaoOptions}
          placeholder="Selecione o tipo"
          required
          error={errors.tipoIntegracao}
        />
        <Input
          label="Credenciadora"
          value={credenciadora}
          onChange={(e) => setCredenciadora(e.target.value)}
          required
          error={errors.credenciadora}
        />
        <Input
          label="Bandeira"
          value={bandeira}
          onChange={(e) => setBandeira(e.target.value)}
          required
          error={errors.bandeira}
        />
        <Input
          label="Nº Autorização"
          value={numeroAutorizacao}
          onChange={(e) => setNumeroAutorizacao(e.target.value)}
          required
          error={errors.numeroAutorizacao}
        />
        <Input
          label="Nº NSU"
          value={numeroNsu}
          onChange={(e) => setNumeroNsu(e.target.value)}
        />

        <div className="flex justify-end space-x-2 mt-6">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            Salvar Dados
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ElectronicDataModal;