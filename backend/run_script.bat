@echo off
set PYTHON311="C:\Users\drraj\AppData\Local\Programs\Python\Python311\python.exe"
%PYTHON311% -m pip install --upgrade pip
%PYTHON311% -m pip install futurehouse-client
%PYTHON311% main.py
pause
