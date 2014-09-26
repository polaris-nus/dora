import json, operator
from django.shortcuts import render
from dora.models import *
from django.template import Context, loader

#Returns the query result set from a given request
#Pre: must have disease request
def parse_request(request):
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
		
	if (location):
		filter_args['coordinates__within'] = location

	if (age_range_filter):
		age_range_filter_list = age_range_filter.split(',');
		for age_range in age_range_filter_list:
			#do some age_range logic here.
			#How to union the two "sets" or just add on stuff
			pass

	#Make the query
	return filter_args

def get_query_result_set(filter_args):
	return Encounter.objects.filter(**filter_args).order_by('patient__uuid')

#Creates a list of json objects from the given query_result_set
def create_json_obj_list(query_result_set):
	json_obj_list = []
	json_obj_list.append([])
	json_obj_list.append([])
	if (query_result_set):
		json_template = loader.get_template('json_obj_template')
		for query_result in query_result_set:
			context_args = {}
			context_args['disease_name'] = query_result.disease.name
			context_args['patient_uuid'] = query_result.patient.uuid
			context_args['patient_family_name'] = query_result.patient.family_name
			context_args['patient_given_name'] = query_result.patient.given_name
			context_args['patient_dob'] = query_result.patient.dob
			context_args['patient_gender'] = query_result.patient.gender
			context_args['created_date'] = query_result.created
			context_args['modified_date'] = query_result.modified
			context_args['coordinates'] = "None"
			context_args['altitude'] = "alt!"

			if (query_result.patient.coordinates):
				context_args['coordinates'] = query_result.patient.coordinates.wkt
				json_obj = json_template.render(Context(context_args))
				json_obj_list[0].append(json_obj)
			else:
				json_obj = json_template.render(Context(context_args))
				json_obj_list[1].append(json_obj)

	return json_obj_list;


#Creates a json array of objects from a given list of json objects. Pre cond: = 2
def generate_json_obj_to_return(json_obj_list):
	json_complete = "{\n"

	if (len(json_obj_list) == 2) :
		json_complete += '"assigned" : ' + (generate_json_from_list(json_obj_list[0]) + ",\n")

		json_complete += '"unassigned" : ' + (generate_json_from_list(json_obj_list[1]) + ",\n")

		json_complete += '"centroid" : ' + '"CENTROID!"' + "\n"

	json_complete += "\n}"

	return json_complete

def generate_json_from_list(json_obj_list):
	json_array = "[\n"
	for i in range(0, len(json_obj_list)-1):
		json_array += (json_obj_list[i] + ",\n")

	if (len(json_obj_list) > 0):
		json_array += json_obj_list[len(json_obj_list)-1]

	json_array += "\n]"

	return json_array