import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { authClient } from '../../lib/auth-client';
import { resetPasswordSchema, type ResetPasswordFormData } from '../../lib/schemas';

export function ResetPasswordForm({ token }: { token: string | null }) {
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({ resolver: zodResolver(resetPasswordSchema) });

  if (!token) {
    return (
      <div className="text-center space-y-3">
        <p className="text-sm text-destructive">
          Este link no es válido o ya expiró. Pide uno nuevo desde "¿Olvidaste tu contraseña?".
        </p>
        <a href="/recuperar-contrasena" className="text-sm text-primary hover:underline">Pedir un nuevo link</a>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center space-y-3">
        <p className="text-sm text-foreground">Tu contraseña fue actualizada correctamente.</p>
        <a href="/login" className="text-primary hover:underline text-sm">Iniciar sesión</a>
      </div>
    );
  }

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError('');
    const result = await authClient.resetPassword({ newPassword: data.password, token });
    if (result.error) {
      setError(result.error.message || 'El link expiró o no es válido. Pide uno nuevo.');
      return;
    }
    setDone(true);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña nueva</Label>
        <Input id="password" type="password" placeholder="Min. 8 caracteres" aria-invalid={!!errors.password} {...register('password')} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar contraseña nueva</Label>
        <Input id="confirmPassword" type="password" placeholder="Repite la contraseña" aria-invalid={!!errors.confirmPassword} {...register('confirmPassword')} />
        {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Guardando...' : 'Restablecer contraseña'}
      </Button>
    </form>
  );
}
