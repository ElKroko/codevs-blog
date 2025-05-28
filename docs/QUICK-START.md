# 🚀 CODEVS - Quick Start Deploy

Este archivo contiene los comandos más utilizados para el despliegue.

## ⚡ Comandos Más Usados

### Para Desarrollo Diario:
```bash
# Observar cambios y generar builds automáticamente
npm run deploy:watch
```

### Para Despliegue a Producción:
```bash
# Despliegue completo (recomendado)
npm run deploy

# Despliegue rápido (cambios menores)
npm run deploy:quick

# Solo frontend
npm run deploy:frontend

# Verificar estado después del deploy
npm run deploy:test
```

## 📋 Checklist de Despliegue

### Antes de Desplegar:
- [ ] ✅ Tu sistema local funciona correctamente (`npm run dev`)
- [ ] ✅ No hay errores en el código
- [ ] ✅ Has probado los cambios localmente

### Durante el Despliegue:
- [ ] ✅ Ejecuta el comando de deploy
- [ ] ✅ Espera a que se genere el ZIP
- [ ] ✅ Sube el archivo a cPanel
- [ ] ✅ Extrae en la carpeta correcta

### Después del Despliegue:
- [ ] ✅ Ejecuta `npm run deploy:test`
- [ ] ✅ Verifica https://codevs.kroko.cl
- [ ] ✅ Prueba funcionalidades principales

## 🎯 URLs de Producción

- **Frontend**: https://codevs.kroko.cl
- **Backend**: https://cms.kroko.cl  
- **WordPress Admin**: https://cms.kroko.cl/wp-admin

## 🆘 Si Algo Sale Mal

```bash
# Verificar estado completo
npm run deploy:test

# Solo verificar backend
npm run deploy:backend

# Regenerar paquete
npm run deploy:quick
```

## 💡 Tips

1. **Usa el modo watch** durante desarrollo activo
2. **Siempre verifica** con el test después de subir
3. **Mantén backups** de archivos importantes
4. **Limpia archivos antiguos** antes de subir nuevos

---

¡Tu sistema está listo para usar! 🎉
