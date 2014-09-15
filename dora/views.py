import json, datetime
from django.http import HttpResponse
from django.shortcuts import render
from dora.models import Disease, Patient

def index(request):	
    return render(request, 'mappage.html', {})


def query(request):
	disease_name = request.GET.get('disease')
	patient_gender = request.GET.get('gender')
	patient_family_name = "Bei"
	patient_given_name = "Own"
	patient_dob = datetime.datetime.now()
	created_date = datetime.datetime.now()
	modified_date = datetime.datetime.now()
	longitude = "long!"
	latitude = "lat!"
	altitude = "alt!"
	json_obj = render(request, 'query_json_template', {
		"disease_name":disease_name, 
		"patient_family_name":patient_family_name, 
		"patient_given_name":patient_given_name, 
		"patient_dob":patient_dob,
		"patient_gender":patient_gender, 
		"created_date":created_date, 
		"modified_date":modified_date, 
		"longitude":longitude, 
		"latitude":latitude, 
		"altitude":altitude
	})	
	return HttpResponse(json_obj, content_type="application/json")