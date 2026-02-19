-- ============================================
-- TRIGGER: Auto-eliminar Profile cuando se elimina un usuario de Supabase Auth
-- ============================================

-- Función que elimina el perfil automáticamente (soft delete)
CREATE OR REPLACE FUNCTION public.handle_user_deleted()
RETURNS TRIGGER AS $$
BEGIN
  -- Soft delete: marcar como eliminado
  UPDATE public.profiles
  SET "deletedAt" = NOW(),
      "updatedAt" = NOW()
  WHERE "supabaseUserId" = OLD.id;

  -- También soft delete del Player si existe
  UPDATE public.players
  SET "deletedAt" = NOW(),
      "updatedAt" = NOW()
  WHERE "supabaseUserId" = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger en la tabla auth.users
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_deleted();

-- ============================================
-- COMENTARIOS
-- ============================================

COMMENT ON FUNCTION public.handle_user_deleted() IS 
'Trigger function que automáticamente marca como eliminado (soft delete) el Profile 
y Player cuando un usuario es eliminado de Supabase Auth.';

COMMENT ON TRIGGER on_auth_user_deleted ON auth.users IS 
'Trigger que ejecuta handle_user_deleted() cuando se elimina un usuario de auth.users';

