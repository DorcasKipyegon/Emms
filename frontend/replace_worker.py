import os
import re

directories = [
    r'C:\Users\Dorcas-chumba\Desktop\CMMs\frontend\src\components',
    r'C:\Users\Dorcas-chumba\Desktop\CMMs\frontend\src\pages'
]
files_to_update = [
    r'C:\Users\Dorcas-chumba\Desktop\CMMs\frontend\src\App.jsx'
]

for d in directories:
    for root, _, files in os.walk(d):
        for file in files:
            if file.endswith('.jsx'):
                files_to_update.append(os.path.join(root, file))

for file_path in files_to_update:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    new_content = content.replace('Worker', 'Employee')
    new_content = new_content.replace('worker', 'employee')
    new_content = new_content.replace('WORKER', 'EMPLOYEE')
    
    if new_content != content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file_path}")
