#!/usr/bin/env python3
# Main entry point for ScriptLauncher

import sys
import os
import tkinter as tk

# Add the current directory to Python path to ensure imports work
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main_app import main

if __name__ == "__main__":
    main()