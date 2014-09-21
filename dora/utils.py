import json
from django.shortcuts import render
from dora.models import *
from django.template import Context, loader

#Returns the query result set from a given request
#Pre: must have disease request
def get_query_result_set(request):
	disease_name = request.GET.get('disease')
	if (not disease_name):
		return None
		
	patient_gender_filter = request.GET.get('gender')
	location_filter = request.GET.get('location')
	age_range_filter = request.GET.get('age_range')

	#Construct filter arguments
	filter_args = {}
	filter_args['disease__name__iexact'] = disease_name

	if (patient_gender_filter):
		filter_args['patient__gender'] = patient_gender_filter

	if (age_range_filter):
		age_range_filter_list = age_range_filter.split(',');
		for age_range in age_range_filter_list:
			#do some age_range logic here.
			#How to union the two "sets" or just add on stuff
			pass

	#Make the query
	return Encounter.objects.filter(**filter_args)

#Creates a list of json objects from the given query_result_set
def create_json_obj_list(query_result_set):
	json_obj_list = []
	if (query_result_set):
		for query_result in query_result_set:
			json_template = loader.get_template('query_json_template')
			json_obj = json_template.render(Context({
				"disease_name":query_result.disease.name, 
				"patient_uuid":query_result.patient.uuid, 
				"patient_family_name":query_result.patient.family_name, 
				"patient_given_name":query_result.patient.given_name, 
				"patient_dob":query_result.patient.dob,
				"patient_gender":query_result.patient.gender, 
				"created_date":query_result.created, 
				"modified_date":query_result.modified, 
				"longitude":query_result.patient.coordinates.x, 
				"latitude":query_result.patient.coordinates.y, 
				"altitude":"alt!"
			}))
			json_obj_list.append(json_obj)
	return json_obj_list;


#Creates a json array of objects from a given list of json objects
def generate_json_obj_to_return(json_obj_list):
	json_complete = "[\n"
	for i in range(0, len(json_obj_list)-1):
		json_complete += (json_obj_list[i] + ",\n")

	if (len(json_obj_list) > 0):
		json_complete += json_obj_list[len(json_obj_list)-1]

	json_complete += "\n]"

	return json_complete