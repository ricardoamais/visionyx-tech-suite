CREATE OR REPLACE FUNCTION public.check_company_payment_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if billing fields are being modified
  IF (NEW.payment_status <> OLD.payment_status OR NEW.plan_expires_at <> OLD.plan_expires_at) THEN
    -- If the user is NOT the super admin
    IF (COALESCE(auth.jwt() ->> 'email', '') <> 'amaiscontratos@gmail.com') THEN
      -- They can only change status TO 'pending'
      IF (NEW.payment_status <> 'pending' OR NEW.plan_expires_at <> OLD.plan_expires_at) THEN
        RAISE EXCEPTION 'Somente o administrador do sistema pode confirmar pagamentos ou alterar vencimentos.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_check_company_payment_update ON public.companies;
CREATE TRIGGER trigger_check_company_payment_update
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION public.check_company_payment_update();
