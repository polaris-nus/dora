import json, operator
from django.shortcuts import render
from mds.dora.models import *
from mds.core.models import *
from django.db.models import Q
from mds.dora.forms import QueryForm
from datetime import *
from django.template import Context, loader

#Parses the given request
#Returns Q-Object query, Q-Object List concepts_list, Q-Object List locations_list
def parse_request(request):
	query_form = QueryForm(request.POST)
	
	if query_form.is_valid():
		cleaned_data = dict(query_form.cleaned_data)

		#Non-observation filters
		gender_filter = cleaned_data['gender']
		age_range_filter = cleaned_data['age_range']
		procedure_filter = cleaned_data['procedure']
		patients_family_name_filter = cleaned_data['patients_family_name']
		patients_given_name_filter = cleaned_data['patients_given_name']
		observers_username_filter = cleaned_data['observers_username']

		#Observation Filters
		concept_name = {}
		concept_name['diagnosis'] = 'diagnosis'
		concept_name['surgical_site_drainage_odor'] = 'sx site drainage odor'
		concept_name['color_of_surgical_site_drainage'] = 'sx site drainage color'
		concept_name['surgical_site_drainage_viscosity'] = 'sx site drainage viscosity'
		concept_name['fever_post_surgical_procedure'] = 'fever post sx'
		concept_name['location_at_patients_house'] = 'location patient house'
		concept_name['drainage_at_surgery_site'] = 'sx site drainage'
		concept_name['surgical_site_pain'] = 'sx site pain'
		concept_name['redness_at_surgical_site'] = 'sx site redness'
		concept_name['swelling_at_surgical_site'] = 'sx site swelling'
		concept_name['firmness_at_surgical_site'] = 'firmness sx site'
		concept_name['spontaneous_opening_at_surgical_site'] = 'sx site open spontaneous'
		concept_name['infection_suspected_at_surgical_site'] = 'sx site infection suspected'
		#concept_name['operation_date'] = 'operation date'
		#concept_name['discharge_date'] = 'discharge date'
		#concept_name['follow_up_date'] = 'follow up date'

		#Location Filter
		location_filter = cleaned_data['location']

		#Construct filter arguments
		q_object = Q()
		concepts_list = []
		locations_list = []
		flag = False;

		#Non-observation Queries
		if (gender_filter):
			q_object &= Q(subject__gender__iexact=gender_filter)
			flag = True;

		if (procedure_filter):
			q_object &= Q(procedure__description__iexact=procedure_filter)
			flag = True;

		if (patients_family_name_filter):
			q_object &= Q(subject__family_name__iexact=patients_family_name_filter)
			flag = True;

		if (patients_given_name_filter):
			q_object &= Q(subject__given_name__iexact=patients_given_name_filter)
			flag = True;

		if (observers_username_filter):
			q_object &= Q(observer__user__username__iexact=observers_username_filter)
			flag = True;

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
			flag = True;

		#Observation (Concept) Queries
		for key in concept_name:
			if (cleaned_data[key]):
				concepts_list.append(Q(concept__name__iexact=concept_name[key]) & Q(value_text__iexact=cleaned_data[key]))
				flag = True;


		#Location Queries
		#location is given by a JSON array of wkt strings
		if location_filter:
			try:
				geometries = json.loads(location_filter)
				q_object_geometry = Q()
				for geometry in geometries:
					q_object_geometry |= Q(coordinates__within=geometry)
				locations_list.append(q_object_geometry)
				flag = True
			
			except ValueError:
				return None, None, None


		if (flag == False):
			return None, None, None

		return q_object, concepts_list, locations_list

	else:
		return None, None, None

#Takes in a Q-Object query and gets a set of data, and filters according to concepts_list and locations_list
#Returns a query result set
def get_query_result_set(query, concepts_list, locations_list):
	if (query == None and concepts_list == None):
		return None
	encounter_QRS = Encounter.objects.select_related('subject', 'observer', 'procedure').filter(query).order_by('created')

	for concept in concepts_list:
		concept_filter = Observation.objects.filter(concept).values_list('encounter__uuid', flat=True)
		encounter_QRS = encounter_QRS.filter(uuid__in=list(concept_filter))

	for location in locations_list:
		location_filter = EncounterLocation.objects.filter(location).values_list('encounter__uuid', flat=True)
		encounter_QRS = encounter_QRS.filter(uuid__in=list(location_filter))		

	return encounter_QRS

#Creates a list of objects from the given query_result_set and generates a JSON String from it
def create_json_response(query_result_set):

	json_response = {}
	json_response['assigned'] = []
	json_response['unassigned'] = []
	json_response['status'] = "ok"
	locations = EncounterLocation.objects.all() #Need to query the REAL Location Model

	counter = 0
	#list(query_result_set)
	if (query_result_set is not None and query_result_set.exists()):
		for query_result in query_result_set.iterator():
			subject = query_result.subject
			encounter_object = {}
			encounter_object['uuid'] = query_result.uuid
			encounter_object['subject'] = {}
			encounter_object['subject']['family_name'] = subject.family_name
			encounter_object['subject']['given_name'] = subject.given_name
			encounter_object['subject']['dob'] = str(subject.dob)
			encounter_object['subject']['gender'] = subject.gender
			encounter_object['created_date'] = str(query_result.created)
			encounter_object['procedure'] = query_result.procedure.description
			encounter_object['observer'] = str(query_result.observer.user)
			encounter_object['location'] = {}
			encounter_object['location']['coords'] = "None"

			if locations.filter(encounter__uuid=query_result.uuid).exists():
				encounter_with_coords = locations.filter(encounter__uuid=query_result.uuid)
				#for encounter in encounter_with_coords:
				encounter_object['location']['coords'] = str(encounter_with_coords[0].coordinates)
				json_response['assigned'].append(encounter_object)
			else:
				json_response['unassigned'].append(encounter_object)

			counter += 1

	results = json.dumps(json_response, separators=(',',':'))
	
	#print json.dumps(json_response, indent=4, separators=(',', ': '))
	return results

#Takes in a user and returns a list of saved queries belonging to the user
def get_user_saved_queries(user):
	response = {}
	response['queries'] = []

	user_saved_queries = SavedQuery.objects.filter(user=user)
	for item in user_saved_queries:
		query = {}
		query['uuid'] = item.uuid
		query['query'] = item.query
		query['location'] = item.location
		query['created'] = str(item.created)
		query['alias'] = item.alias
		response['queries'].append(query)

	return json.dumps(response)

#Takes in a uuid and returns the saved query with that uuid
def get_saved_query(uuid):
	return SavedQuery.objects.get(uuid=uuid)