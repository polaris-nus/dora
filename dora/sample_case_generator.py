import uuid, datetime, random
from string import Template

LATEST_BACKDATE_YEARS = 2
OLDEST_PERSON = 75
DIAGNOSIS_CONCEPT = '104889a3-b6fa-4cdc-b232-d3b73e924cd1'
LOCATION_GPS_CONCEPT = '022f8c4f-ca4b-4d2f-b8c6-20a77bea9065'
TEMPLATE_ROOT = 'templates/sample_generator_templates/'
NUMBER_OF_SUBJECTS = 20*10
NUMBER_OF_ENCOUNTERS = 30*10

encounter_counter = 1
observation_counter = 1
subject_counter = 1
procedure_counter = 1
location_counter = 1

default_db_items_up = open(TEMPLATE_ROOT + 'default_db_items_up').read()
default_db_items_down = open(TEMPLATE_ROOT + 'default_db_items_down').read()
encounter_template = Template(open(TEMPLATE_ROOT + 'encounter_template').read())
observation_template = Template(open(TEMPLATE_ROOT + 'observation_template').read())
subject_template = Template(open(TEMPLATE_ROOT + 'subject_template').read())
procedure_template = Template(open(TEMPLATE_ROOT + 'procedure_template').read())
location_template = Template(open(TEMPLATE_ROOT + 'location_template').read())

#Read in data from text file
names = []
with open(TEMPLATE_ROOT + 'names.txt') as file:
	names = file.read().splitlines()

procedure = []
with open(TEMPLATE_ROOT + 'procedure.txt') as file:
	procedure = file.read().splitlines()

location = []
with open(TEMPLATE_ROOT + 'location.txt') as file:
	location = file.read().splitlines()

disease = []
with open(TEMPLATE_ROOT + 'disease.txt') as file:
	disease = file.read().splitlines()



#Create Locations first
location_uuid_list = []
location_json = ""
for location_name in location:
	location_uuid = uuid.uuid4()
	location_uuid_list.append(location_uuid)
	location_dictionary = {'location_number':location_counter, 'location_uuid':location_uuid, 'location_name': location_name}
	location_json = location_json + location_template.substitute(location_dictionary) + ",\n"
	location_counter = location_counter + 1;



#Create Subject each with a location
subject_uuid_list = []
subject_json = ""
for i in range(0, NUMBER_OF_SUBJECTS):
	#set created date
	created_date = datetime.datetime.now() - datetime.timedelta(days=random.randint(0,LATEST_BACKDATE_YEARS*365), hours=random.randint(0,23), minutes=random.randint(0,59))

	#set DOB but make sure it is before created date
	birth_date = datetime.datetime.now() - datetime.timedelta(days=random.randint(0,OLDEST_PERSON*365), hours=random.randint(0,23), minutes=random.randint(0,59))
	while (birth_date > created_date):
		birth_date = datetime.datetime.now() - datetime.timedelta(days=random.randint(0,OLDEST_PERSON*365), hours=random.randint(0,23), minutes=random.randint(0,59))

	#set gender
	subject_gender = 'M'
	if (random.randint(0,1) == 0):
		subject_gender = 'F'

	#generate the actual subject
	subject_uuid = uuid.uuid4()
	subject_uuid_list.append(subject_uuid)
	family_name = names[random.randint(0,len(names)-1)]
	given_name = names[random.randint(0,len(names)-1)]
	subject_dictionary = {'subject_number':subject_counter, 'subject_uuid':subject_uuid, 'family_name':family_name, 'given_name':given_name, 'subject_gender':subject_gender, 'created_date':created_date, 'birth_date':birth_date, 'location_uuid':location_uuid_list[random.randint(0,len(location_uuid_list)-1)]}
	subject_json = subject_json + subject_template.substitute(subject_dictionary) + ",\n"
	subject_counter = subject_counter + 1;



#Create Procedures
procedure_uuid_list = []
procedure_json = ""
for actual_procedure in procedure:
	created_date = datetime.datetime.now() - datetime.timedelta(days=random.randint(0,LATEST_BACKDATE_YEARS*365), hours=random.randint(0,23), minutes=random.randint(0,59))
	procedure_uuid = uuid.uuid4()
	procedure_uuid_list.append(procedure_uuid)
	procedure_dictionary = {'procedure_number':procedure_counter, 'procedure_uuid':procedure_uuid, 'created_date':created_date, 'procedure_desc':actual_procedure}
	procedure_json = procedure_json + procedure_template.substitute(procedure_dictionary) + ",\n"
	procedure_counter = procedure_counter + 1;


#start generating encounters and observations
encounter_json = ""
observation_json = ""
for i in range(0, NUMBER_OF_ENCOUNTERS):


	#Create encounters each with a Subject and Procedure
	created_date = datetime.datetime.now() - datetime.timedelta(days=random.randint(0,LATEST_BACKDATE_YEARS*365), hours=random.randint(0,23), minutes=random.randint(0,59))
	encounter_uuid = uuid.uuid4()
	disease_index = random.randint(0,len(procedure_uuid_list)-1)
	encounter_dictionary = {'encounter_number':encounter_counter, 'encounter_uuid':encounter_uuid, 'created_date':created_date, 'subject_uuid':subject_uuid_list[random.randint(0,len(subject_uuid_list)-1)], 'procedure_uuid':procedure_uuid_list[disease_index]}
	encounter_json = encounter_json + encounter_template.substitute(encounter_dictionary) + ",\n"
	encounter_counter = encounter_counter + 1;

	#Create a Diagnosis
	observation_uuid = uuid.uuid4()
	observation_value = disease[disease_index]
	observation_concept = DIAGNOSIS_CONCEPT
	observation_node = "1"
	observation_dictionary = {'observation_number':observation_counter, 'observation_node':observation_node, 'observation_value':observation_value, 'observation_concept':observation_concept, 'observation_uuid':observation_uuid, 'created_date':created_date, 'encounter_uuid': encounter_uuid}
	observation_json = observation_json + observation_template.substitute(observation_dictionary) + ",\n"
	observation_counter = observation_counter + 1;

	#and Location GPS for the encounter
	if (not (random.randint(0,4)%5 == 0)):
		observation_uuid = uuid.uuid4()
		longitude = random.uniform(-16, 8) 
		latitude = random.uniform(6.5, 28.5) 
		altitude = random.uniform(0, 20) 
		observation_value = "(" + str(longitude) + ", " + str(latitude) + ", " + str(altitude) +")"
		observation_concept = LOCATION_GPS_CONCEPT
		observation_node = "1a"
		observation_dictionary = {'observation_number':observation_counter, 'observation_node':observation_node, 'observation_value':observation_value, 'observation_concept':observation_concept, 'observation_uuid':observation_uuid, 'created_date':created_date, 'encounter_uuid': encounter_uuid}
		observation_json = observation_json + observation_template.substitute(observation_dictionary) + ",\n"
		observation_counter = observation_counter + 1;


print default_db_items_up + location_json + procedure_json + subject_json + encounter_json + observation_json + default_db_items_down