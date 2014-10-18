import json, operator
from django.shortcuts import render
from mds.dora.models import *
from django.db.models import Q
from mds.dora.forms import QueryForm
from datetime import *
from django.template import Context, loader

#Returns the query result set from a given request
#Pre: must have disease request
def parse_request(request):
	query_form = QueryForm(request.GET)
	
	if query_form.is_valid():
		cleaned_data = dict(query_form.cleaned_data)
		print cleaned_data
		disease_name = cleaned_data['disease']
		if (not disease_name):
			return None
		patient_gender_filter = cleaned_data['gender']
		location_filter = cleaned_data['location']
		age_range_filter = cleaned_data['age_range']
	
		#Construct filter arguments
		q_object = Q(disease__name__iexact=disease_name)
	
		if (patient_gender_filter):
			q_object &= Q(patient__gender=patient_gender_filter)
			
		if (location_filter):
			q_object_geometry = Q()
			for geometry in location_filter:
				q_object_geometry |= Q(patient__coordinates__within=geometry)
			q_object &= q_object_geometry
	
		if (age_range_filter):
			q_object_age_range = Q()
			now = datetime.now()
			age_range_filter_list = age_range_filter.split(',')
			for age_range in age_range_filter_list:
				age_range_list = age_range.split('-')
				if (len(age_range_list) != 2 or (not age_range_list[0].isdigit()) or (not age_range_list[1].isdigit())):
					return None
				age_start = int(age_range_list[0])
				age_end = int(age_range_list[1]) + 1
				q_object_age_range |= (Q(patient__dob__lte=datetime(year=now.year-age_start, month=now.month, day=now.day)) & Q(patient__dob__gte=datetime(year=now.year-age_end, month=now.month, day=now.day)))
			q_object &= q_object_age_range
	
		return q_object
	
	else:
		return None

def get_query_result_set(query):
	if (query == None):
		return None	
	return Encounter.objects.filter(query).order_by('created')

#Creates a list of json objects from the given query_result_set
def create_json_obj_list(query_result_set):
	json_obj_list = []
	json_obj_list.append([])
	json_obj_list.append([])
	if (query_result_set):
		json_template = loader.get_template('json_obj_template')
		for query_result in query_result_set:
			context_args = {}
			context_args['encounter_uuid'] = query_result.uuid
			context_args['disease_name'] = query_result.disease.name
			context_args['patient_uuid'] = query_result.patient.uuid
			context_args['patient_family_name'] = query_result.patient.family_name
			context_args['patient_given_name'] = query_result.patient.given_name
			context_args['patient_dob'] = str(query_result.patient.dob)
			context_args['patient_gender'] = query_result.patient.gender
			context_args['created_date'] = str(query_result.created)
			context_args['modified_date'] = str(query_result.modified)
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

		json_complete += '"unassigned" : ' + (generate_json_from_list(json_obj_list[1]) + "\n")

	json_complete += "}"

	return json_complete

def generate_json_from_list(json_obj_list):
	json_array = "[\n"
	for i in range(0, len(json_obj_list)-1):
		json_array += (json_obj_list[i] + ",\n")

	if (len(json_obj_list) > 0):
		json_array += json_obj_list[len(json_obj_list)-1]

	json_array += "\n]"

	return json_array