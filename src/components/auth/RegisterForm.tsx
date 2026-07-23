import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { signUp } from '../../lib/auth-client';
import { registerSchema, type RegisterFormData } from '../../lib/schemas';

export function RegisterForm() {
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) });

  const inviteToken = new URLSearchParams(window.location.search).get('invite');

  const onSubmit = async (data: RegisterFormData) => {
    setError('');
    try {
      const result = await signUp.email({
        email: data.email,
        password: data.password,
        name: data.name,
        // @ts-expect-error -- additionalFields no está tipado en el cliente de Better Auth.
        phone: data.phone,
      });
      if (result.error) {
        setError(result.error.message || 'Error al registrar la cuenta');
        return;
      }

      // Si vino de un link de invitación, vincula la cuenta nueva a la ficha
      // de tutor que el staff ya preparó (con sus mascotas y su historial).
      if (inviteToken) {
        try {
          await fetch('/api/invites/redeem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: inviteToken }),
          });
        } catch {
          // Si falla la vinculación, la cuenta igual queda creada; el tutor
          // puede pedir un nuevo link a la clínica.
        }
      }

      window.location.href = '/dashboard';
    } catch {
      setError('Error al registrar. Intente de nuevo.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {inviteToken && (
        <div className="text-sm bg-primary/10 text-primary rounded-lg p-3">
          Estás aceptando una invitación de la clínica — al crear tu cuenta quedará vinculada automáticamente a tus mascotas.
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="name">Nombre completo</Label>
        <Input id="name" type="text" placeholder="Juan Perez" aria-invalid={!!errors.name} {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Correo electronico</Label>
        <Input id="email" type="email" placeholder="correo@ejemplo.com" aria-invalid={!!errors.email} {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefono</Label>
        <Input id="phone" type="tel" placeholder="+506 8888-8888" aria-invalid={!!errors.phone} {...register('phone')} />
        {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contrasena</Label>
        <Input id="password" type="password" placeholder="Min. 8 caracteres" aria-invalid={!!errors.password} {...register('password')} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirmar contrasena</Label>
        <Input id="confirmPassword" type="password" placeholder="Repite la contrasena" aria-invalid={!!errors.confirmPassword} {...register('confirmPassword')} />
        {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Ya tienes cuenta?{' '}
        <a href="/login" className="text-primary hover:underline">
          Inicia sesion
        </a>
      </p>
    </form>
  );
}
