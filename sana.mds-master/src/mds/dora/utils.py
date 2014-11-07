import cjson, operator
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
		print "form is valid"
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
			q_object &= Q(procedure__iexact=procedure_filter)
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
				print location_filter
				#geometries = json.loads(location_filter)
				geometries = cjson.decode(location_filter)
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
		print "form is invalid"
		return None, None, None

def get_query_result_set(query, concepts_list, locations_list):
	if (query == None and concepts_list == None):
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
def create_json_response(query_result_set):
	#query_result_set = list(query_result_set)
	start = datetime.now()

	# json_obj_list = []
	# json_obj_list.append([])
	# json_obj_list.append([])
	# locations = EncounterLocation.objects.all() #Need to query the REAL Location Model
	# if (query_result_set):
	# 	json_template = loader.get_template('json_obj_template')
	# 	for query_result in query_result_set:
	# 		context_args = {}
	# 		context_args['encounter_uuid'] = query_result.uuid
	# 		context_args['subject_uuid'] = query_result.subject.uuid
	# 		context_args['subject_family_name'] = query_result.subject.family_name
	# 		context_args['subject_given_name'] = query_result.subject.given_name
	# 		context_args['subject_dob'] = str(query_result.subject.dob)
	# 		context_args['subject_gender'] = query_result.subject.gender
	# 		context_args['created_date'] = str(query_result.created)
	# 		context_args['modified_date'] = str(query_result.modified)
	# 		context_args['procedure'] = query_result.procedure.description
	# 		context_args['observer'] = str(query_result.observer.user)
	# 		context_args['coordinates'] = "None"
	# 		context_args['altitude'] = "alt!"

	# 		if locations.filter(encounter__uuid=query_result.uuid).exists():
	# 			encounter_with_coords = locations.filter(encounter__uuid=query_result.uuid)
	# 			for encounter in encounter_with_coords:
	# 				context_args['coordinates'] = encounter.coordinates
	# 			json_obj = json_template.render(Context(context_args))
	# 			json_obj_list[0].append(json_obj)
	# 		else:
	# 			json_obj = json_template.render(Context(context_args))
	# 			json_obj_list[1].append(json_obj)

	# 	json_response = generate_json_obj_to_return(json_obj_list)

	# end = datetime.now()
	# print (end-start)
	# return json_response

	json_response = {}
	json_response['assigned'] = []
	json_response['unassigned'] = []
	json_response['status'] = "ok"
	locations = EncounterLocation.objects.all() #Need to query the REAL Location Model
	if (query_result_set):
		for query_result in query_result_set:
			encounter_object = {}
			encounter_object['uuid'] = query_result.uuid
			encounter_object['subject'] = {}
			encounter_object['subject']['family_name'] = query_result.subject.family_name
			encounter_object['subject']['uuid'] = query_result.subject.uuid
			encounter_object['subject']['given_name'] = query_result.subject.given_name
			encounter_object['subject']['dob'] = str(query_result.subject.dob)
			encounter_object['subject']['gender'] = query_result.subject.gender
			encounter_object['created_date'] = str(query_result.created)
			encounter_object['modified_date'] = str(query_result.modified)
			encounter_object['procedure'] = query_result.procedure.description
			encounter_object['observer'] = str(query_result.observer.user)
			encounter_object['location'] = {}
			encounter_object['location']['coords'] = "None"
			encounter_object['location']['alt'] = "alt!"

			if locations.filter(encounter__uuid=query_result.uuid).exists():
				encounter_with_coords = locations.filter(encounter__uuid=query_result.uuid)
				for encounter in encounter_with_coords:
					encounter_object['location']['coords'] = str(encounter.coordinates)
				json_response['assigned'].append(encounter_object)
			else:
				json_response['unassigned'].append(encounter_object)


	end = datetime.now()
	print ("time taken for create_json_response: " + str(end-start))
	return cjson.encode(json_response)


#Creates a json array of objects from a given list of json objects. Pre cond: = 2
def generate_json_obj_to_return(json_obj_list):
	json_complete = "{\n"

	if (len(json_obj_list) == 2) :
		json_complete += '"assigned" : ' + (generate_json_from_list(json_obj_list[0]) + ",\n")

		json_complete += '"unassigned" : ' + (generate_json_from_list(json_obj_list[1]) + ",\n")

		json_complete += '"status" : "ok"\n' 

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


def get_user_saved_queries(request):
	response = {}
	response['queries'] = []

	user_saved_queries = SavedQuery.objects.filter(user=request.user)
	for item in user_saved_queries:
		query = {}
		query['uuid'] = item.uuid
		query['query'] = item.query
		query['location'] = item.location
		query['created'] = str(item.created)
		query['alias'] = item.alias
		response['queries'].append(query)

	#return json.dumps(response)
	return cjson.encode(response)
