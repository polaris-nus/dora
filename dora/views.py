import json, datetime
from django.http import HttpResponse
from django.shortcuts import render
from dora.models import *
from django.template import Context, loader

def index(request):	
    return render(request, 'mappage.html', {})


def query(request):
	disease_name = request.GET.get('disease')
	patient_gender_filter = request.GET.get('gender')
	location_filter = request.GET.get('location')
	age_range_filter = request.GET.get('age_range')

	#Construct filter arguments
	filter_args = {}
	filter_args['{0}__{1}'.format('disease', 'name')] = disease_name

	if (patient_gender_filter):
		filter_args['{0}__{1}'.format('patient', 'gender')] = patient_gender_filter

	if (age_range_filter):
		age_range_filter_list = age_range_filter.split(',');
		for age_range in age_range_filter_list:
			#do some age_range logic here.
			#How to union the two "sets" or just add on stuff
			pass


	#Make the query
	query_result_set = Encounter.objects.filter(**filter_args)


	#Create a list of json objects
	json_obj_list = []
	for query_result in query_result_set:

		json_template = loader.get_template('query_json_template')
		json_obj = json_template.render(Context({
			"disease_name":disease_name, 
			"patient_family_name":query_result.patient.family_name, 
			"patient_given_name":query_result.patient.given_name, 
			"patient_dob":query_result.patient.dob,
			"patient_gender":query_result.patient.gender, 
			"created_date":query_result.created, 
			"modified_date":query_result.modified, 
			"longitude":query_result.lon, 
			"latitude":query_result.lat, 
			"altitude":"alt!"
		}))
		json_obj_list.append(json_obj)


	#transform json objects into one json array of objects
	json_complete = "[\n"
	for i in range(0, len(json_obj_list)-1):
		json_complete += (json_obj_list[i] + ",\n")

	if (len(json_obj_list) > 0):
		json_complete += json_obj_list[len(json_obj_list)-1]

	json_complete += "\n]"

	return HttpResponse(json_complete, content_type="application/json")