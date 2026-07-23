import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { authClient } from '../../lib/auth-client';
import { requestPasswordResetSchema, type RequestPasswordResetFormData } from '../../lib/schemas';

export function RequestPasswordResetForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestPasswordResetFormData>({ resolver: zodResolver(requestPasswordResetSchema) });

  const onSubmit = async (data: RequestPasswordResetFormData) => {
    setError('');
    try {
      await authClient.requestPasswordReset({
        email: data.email,
        redirectTo: '/restablecer-contrasena',
      });
      // Por seguridad, Better Auth siempre responde éxito exista o no ese
      // correo — así no se puede usar este formulario para averiguar qué
      // emails están registrados.
      setSent(true);
    } catch {
      setError('Error al procesar la solicitud. Intente de nuevo.');
    }
  };

  if (sent) {
    return (
      <div className="text-center space-y-3">
        <p className="text-sm text-foreground">
          Si ese correo está registrado, te enviamos un link para restablecer tu contraseña. Revisa tu bandeja de entrada (y spam).
        </p>
        <a href="/login" className="text-sm text-primary hover:underline">Volver a iniciar sesión</a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <p className="text-sm text-muted-foreground">
        Ingresa el correo con el que te registraste y te enviaremos un link para elegir una contraseña nueva.
      </p>

      <div className="space-y-2">
        <Label htmlFor="email">Correo electronico</Label>
        <Input id="email" type="email" placeholder="correo@ejemplo.com" aria-invalid={!!errors.email} {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Enviando...' : 'Enviar link de recuperación'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <a href="/login" className="text-primary hover:underline">Volver a iniciar sesión</a>
      </p>
    </form>
  );
}
