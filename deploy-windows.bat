@echo off
REM ============================================================
REM  TousLocation - Deploiement "un clic" pour Windows
REM  Double-cliquez sur ce fichier pour installer et lancer l'app.
REM  (Prerequis : PHP 8.3+, Composer, Node 18+, MySQL/MariaDB)
REM ============================================================
title TousLocation - Deploiement Windows
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy-windows.ps1" %*
echo.
echo Appuyez sur une touche pour fermer cette fenetre...
pause >nul
