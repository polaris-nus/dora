import json, operator
from django.shortcuts import render
from mds.dora.models import *
from mds.core.models import *
from django.db.models import Q
from mds.dora.forms import QueryForm
from datetime import *
from django.template import Context, loader

#Returns the query result set from a given request
#Pre: must have disease request
def parse_request(request):
	query_form = QueryForm(request.POST)
	
	if query_form.is_valid():
		cleaned_data = dict(query_form.cleaned_data)
		print cleaned_data
		disease_name = cleaned_data['disease']
		subject_gender_filter = cleaned_data['gender']
		location_filter = cleaned_data['location']
		age_range_filter = cleaned_data['age_range']

		#Construct filter arguments
		q_object = Q()
		concepts_list = []
		locations_list = []

		#Non-observation Queries
		if (subject_gender_filter):
			q_object &= Q(subject__gender=subject_gender_filter)

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
				q_object_age_range |= (Q(subject__dob__lte=datetime(year=now.year-age_start, month=now.month, day=now.day)) & Q(subject__dob__gte=datetime(year=now.year-age_end, month=now.month, day=now.day)))
			q_object &= q_object_age_range

		#Observation (Concept) Queries
		if (disease_name):
			concepts_list.append(Q(concept__name__iexact='DIAGNOSIS') & Q(value_text__iexact=disease_name))

		#Location Queries
		if (location_filter):
			q_object_geometry = Q()
			for geometry in location_filter:
				q_object_geometry |= Q(subject__coordinates__within=geometry)
			q_object &= q_object_geometry


		return q_object, concepts_list, locations_list

	else:
		return None, None

def get_query_result_set(query, concepts_list, locations_list):
	if (query == None and concept == None):
		return None
	#return Observation.objects.all().values_list('encounter__created', flat=True)
	encounter_QRS = Encounter.objects.filter(query).order_by('created')

	for concept in concepts_list:
		concept_filter = Observation.objects.filter(concept).values_list('encounter__uuid', flat=True)
		encounter_QRS = encounter_QRS.filter(uuid__in=list(concept_filter))

	for location in locations_list:
		location_filter = EncounterLocation.objects.filter(location).values_list('encounter__uuid', flat=True)
		encounter_QRS = encounter_QRS.filter(uuid__in=list(location_filter))		

	return encounter_QRS
	#return Encounter.objects.all()

#Creates a list of json objects from the given query_result_set
def create_json_obj_list(query_result_set):
	json_obj_list = []
	json_obj_list.append([])
	json_obj_list.append([])
	locations = {} #Need to query the REAL Location Model
	if (query_result_set):
		json_template = loader.get_template('json_obj_template')
		for query_result in query_result_set:
			context_args = {}
			context_args['encounter_uuid'] = query_result.uuid
			context_args['subject_uuid'] = query_result.subject.uuid
			context_args['subject_family_name'] = query_result.subject.family_name
			context_args['subject_given_name'] = query_result.subject.given_name
			context_args['subject_dob'] = str(query_result.subject.dob)
			context_args['subject_gender'] = query_result.subject.gender
			context_args['created_date'] = str(query_result.created)
			context_args['modified_date'] = str(query_result.modified)
			context_args['procedure'] = query_result.procedure.description
			context_args['observer'] = str(query_result.observer.user)
			context_args['coordinates'] = "None"
			context_args['altitude'] = "alt!"

			if (query_result.uuid in locations.keys()):
				context_args['coordinates'] = locations[str(query_result.uuid)]
				json_obj = json_template.render(Context(context_args))
				json_obj_list[1].append(json_obj)
			else:
				json_obj = json_template.render(Context(context_args))
				json_obj_list[0].append(json_obj)

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