from django.shortcuts import render
from dora.models import Disease, Patient

def index(request):
	
    return render(request, 'mappage.html', {})