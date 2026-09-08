import os
import sys

# Ensure local dependencies in deps/ are in Python path
base_dir = os.path.dirname(os.path.dirname(__file__))
deps_dir = os.path.join(base_dir, 'deps')
if os.path.exists(deps_dir) and deps_dir not in sys.path:
    sys.path.insert(0, deps_dir)

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

application = get_wsgi_application()
